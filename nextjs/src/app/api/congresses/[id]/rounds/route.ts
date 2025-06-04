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
          monkey_used: row.monkey_used,
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
  { params }: { params: { id: string } }
) {
  try {
    const { difficulty, players }: NewRound = await request.json();
    const congressId = parseInt(params.id);
    const conn = await getDBConnection();

    try {
      // Get next round order
      const [orderResult] = await conn.execute(
        'SELECT COALESCE(MAX(round_order), 0) + 1 as next_order FROM rounds WHERE congress_id = ?',
        [congressId]
      ) as any[];
      
      const nextOrder = orderResult[0]?.next_order || 1;

      // Insert round
      const [roundResult] = await conn.execute(
        'INSERT INTO rounds (congress_id, round_order, difficulty) VALUES (?, ?, ?)',
        [congressId, nextOrder, difficulty]
      ) as any[];

      const roundId = roundResult.insertId;

      // Calculate rankings for all players
      const sortedPlayers = [...players].sort((a, b) => {
        // Stage reached (higher is better)
        if (a.stage_reached !== b.stage_reached) {
          return b.stage_reached - a.stage_reached;
        }
        
        // Extra stages (higher is better)
        if (a.extra_stages !== b.extra_stages) {
          return b.extra_stages - a.extra_stages;
        }
        
        // Lives lost (lower is better)
        if (a.lives_lost !== b.lives_lost) {
          return a.lives_lost - b.lives_lost;
        }
        
        // Tiebreaker points (higher is better, null counts as 0)
        const aTiebreaker = a.tiebreaker_points ?? 0;
        const bTiebreaker = b.tiebreaker_points ?? 0;
        return bTiebreaker - aTiebreaker;
      });

      // Check if this is an unfinished round (all players have 0 stage_reached)
      const isUnfinished = players.every(p => p.stage_reached === 0);

      // Insert player scores
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        // For unfinished rounds, set final_rank to null
        const finalRank = isUnfinished ? null : i + 1;
        
        await conn.execute(
          `INSERT INTO round_players 
           (round_id, player_tag, monkey_used, stage_reached, lives_lost, extra_stages, tiebreaker_points, final_rank) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            roundId,
            player.player_tag,
            player.monkey_used,
            player.stage_reached,
            player.lives_lost,
            player.extra_stages,
            player.tiebreaker_points,
            finalRank
          ]
        );
      }

      return NextResponse.json({ 
        success: true, 
        roundId,
        roundOrder: nextOrder,
        isUnfinished 
      });
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error('Error creating round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
} 