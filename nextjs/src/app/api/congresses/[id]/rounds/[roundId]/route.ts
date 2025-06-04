import { getDBConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { MonkeyType } from "@/types/player";

interface RoundPlayer {
  player_tag: string;
  stage_reached: number;
  lives_lost: number;
  extra_stages: number;
  monkey_used: MonkeyType;
  tiebreaker_points: number | null;
}

interface UpdateRoundRequest {
  players: RoundPlayer[];
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; roundId: string } }
) {
  try {
    const { players }: UpdateRoundRequest = await request.json();
    const roundId = parseInt(params.roundId);
    const conn = await getDBConnection();

    try {
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

      // Update player scores and rankings
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const finalRank = i + 1;
        
        await conn.execute(
          `UPDATE round_players 
           SET stage_reached = ?, lives_lost = ?, extra_stages = ?, tiebreaker_points = ?, final_rank = ?
           WHERE round_id = ? AND player_tag = ?`,
          [
            player.stage_reached,
            player.lives_lost,
            player.extra_stages,
            player.tiebreaker_points,
            finalRank,
            roundId,
            player.player_tag
          ]
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Round updated successfully'
      });
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error('Error updating round:', error);
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    );
  }
} 