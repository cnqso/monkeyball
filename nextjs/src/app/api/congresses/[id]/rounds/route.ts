import { getDBConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { Difficulty } from "@/types/congress";
import { MonkeyType } from "@/types/player";

interface RoundPlayer {
  player_tag: string;
  stage_reached: number;
  lives_lost: number;
  extra_stages: number;
  monkey_used: MonkeyType;
  tiebreaker_points: number | null;
}

interface NewRound {
  difficulty: Difficulty;
  players: RoundPlayer[];
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id: congressId } = await Promise.resolve(context.params);
  
  try {
    const conn = await getDBConnection();
    
    // Get all rounds with their player scores
    const [rounds] = await conn.execute(`
      SELECT 
        r.round_id,
        r.difficulty,
        r.round_order,
        rp.player_tag,
        rp.stage_reached,
        rp.lives_lost,
        rp.extra_stages,
        rp.monkey_used,
        rp.tiebreaker_points,
        rp.final_rank
      FROM rounds r
      LEFT JOIN round_players rp ON r.round_id = rp.round_id
      WHERE r.congress_id = ?
      ORDER BY r.round_order ASC, rp.final_rank ASC
    `, [congressId]);

    await conn.end();

    // Group player scores by round
    const roundsMap = new Map();
    (rounds as any[]).forEach(row => {
      if (!roundsMap.has(row.round_id)) {
        roundsMap.set(row.round_id, {
          round_id: row.round_id,
          difficulty: row.difficulty,
          round_order: row.round_order,
          players: []
        });
      }
      
      if (row.player_tag) {
        roundsMap.get(row.round_id).players.push({
          player_tag: row.player_tag,
          stage_reached: row.stage_reached,
          lives_lost: row.lives_lost,
          extra_stages: row.extra_stages,
          monkey_used: row.monkey_used as MonkeyType,
          tiebreaker_points: row.tiebreaker_points,
          final_rank: row.final_rank
        });
      }
    });

    return NextResponse.json(Array.from(roundsMap.values()));
  } catch (error) {
    console.error('Failed to fetch rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const { id: congressId } = await Promise.resolve(context.params);
  
  try {
    const round: NewRound = await request.json();
    const conn = await getDBConnection();

    try {
      // Start transaction
      await conn.beginTransaction();

      // Get the current round count for this congress
      const [roundCountResult] = await conn.execute(
        'SELECT COUNT(*) as count FROM rounds WHERE congress_id = ?',
        [congressId]
      );
      const roundOrder = (roundCountResult as any)[0].count + 1;

      // Insert the round
      const [roundResult] = await conn.execute(
        'INSERT INTO rounds (congress_id, difficulty, round_order) VALUES (?, ?, ?)',
        [congressId, round.difficulty, roundOrder]
      );
      const roundId = (roundResult as any).insertId;

      // Calculate rankings based on stage_reached, extra_stages, and lives_lost
      const sortedPlayers = [...round.players].sort((a, b) => {
        // First compare stages reached
        if (a.stage_reached !== b.stage_reached) {
          return b.stage_reached - a.stage_reached;
        }
        // Then compare extra stages
        if (a.extra_stages !== b.extra_stages) {
          return b.extra_stages - a.extra_stages;
        }
        // Then compare lives lost (fewer is better)
        if (a.lives_lost !== b.lives_lost) {
          return a.lives_lost - b.lives_lost;
        }
        // Finally, compare tiebreaker points if available
        if (a.tiebreaker_points !== null && b.tiebreaker_points !== null) {
          return b.tiebreaker_points - a.tiebreaker_points;
        }
        return 0;
      });

      // Insert player scores with calculated ranks
      const playerValues = sortedPlayers.map((player, index) => [
        roundId,
        player.player_tag,
        player.stage_reached,
        player.lives_lost,
        player.extra_stages,
        player.monkey_used,
        player.tiebreaker_points,
        index + 1 // rank
      ]);

      await conn.query(
        `INSERT INTO round_players 
         (round_id, player_tag, stage_reached, lives_lost, extra_stages, 
          monkey_used, tiebreaker_points, final_rank) 
         VALUES ?`,
        [playerValues]
      );

      // Commit transaction
      await conn.commit();

      return NextResponse.json({ 
        round_id: roundId,
        message: 'Round created successfully' 
      }, { status: 201 });
    } catch (error) {
      // Rollback on error
      await conn.rollback();
      throw error;
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error('Failed to create round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
} 