import { getDBConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

interface CongressRow extends RowDataPacket {
  congress_id: number;
  players: string | null;
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await Promise.resolve(context.params);
  
  try {
    const conn = await getDBConnection();
    
    // Get congress with its players
    const [congresses] = await conn.execute<CongressRow[]>(`
      SELECT c.*, GROUP_CONCAT(cp.player_tag) as players
      FROM congresses c
      LEFT JOIN congress_players cp ON c.congress_id = cp.congress_id
      WHERE c.congress_id = ?
      GROUP BY c.congress_id
    `, [id]);

    await conn.end();

    if (congresses.length === 0) {
      return NextResponse.json(
        { error: 'Congress not found' },
        { status: 404 }
      );
    }

    const congress = congresses[0];
    
    // Transform players string to array
    return NextResponse.json({
      ...congress,
      players: congress.players ? congress.players.split(',') : []
    });
  } catch (error) {
    console.error('Failed to fetch congress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch congress' },
      { status: 500 }
    );
  }
} 