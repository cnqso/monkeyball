import { getDBConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { NewCongress } from "@/types/congress";
import { RowDataPacket } from "mysql2";

interface CongressRow extends RowDataPacket {
  congress_id: number;
  players: string | null;
}

export async function GET() {
  try {
    const conn = await getDBConnection();
    
    // Get all congresses with their players
    const [congresses] = await conn.execute<CongressRow[]>(`
      SELECT c.*, GROUP_CONCAT(cp.player_tag) as players
      FROM congresses c
      LEFT JOIN congress_players cp ON c.congress_id = cp.congress_id
      GROUP BY c.congress_id
      ORDER BY c.date DESC
    `);

    await conn.end();
    return NextResponse.json(
      congresses.map(congress => ({
        ...congress,
        players: congress.players ? congress.players.split(',') : []
      }))
    );
  } catch (error) {
    console.error('Failed to fetch congresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch congresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const congress: NewCongress = await request.json();
    
    // Validate required fields
    if (!congress.name || !congress.date || !congress.player_tags?.length) {
      return NextResponse.json(
        { error: 'Name, date, and at least one player are required' },
        { status: 400 }
      );
    }

    const conn = await getDBConnection();

    try {
      // Start transaction
      await conn.beginTransaction();

      // Insert congress
      const [result] = await conn.execute(
        'INSERT INTO congresses (name, date, location, notes) VALUES (?, ?, ?, ?)',
        [congress.name, congress.date, congress.location || null, congress.notes || null]
      );

      const congressId = (result as any).insertId;

      // Insert player associations
      const playerValues = congress.player_tags.map(tag => [congressId, tag]);
      await conn.query(
        'INSERT INTO congress_players (congress_id, player_tag) VALUES ?',
        [playerValues]
      );

      // Commit transaction
      await conn.commit();

      return NextResponse.json({ 
        congress_id: congressId,
        message: 'Congress created successfully' 
      }, { status: 201 });
    } catch (error) {
      // Rollback on error
      await conn.rollback();
      throw error;
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error('Failed to create congress:', error);
    return NextResponse.json(
      { error: 'Failed to create congress' },
      { status: 500 }
    );
  }
} 