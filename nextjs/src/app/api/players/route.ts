import { getDBConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { NewPlayer, MonkeyType } from "@/types/player";

export async function GET() {
  try {
    const conn = await getDBConnection();
    const [rows] = await conn.execute(
      'SELECT player_tag, real_name, monkey_preference, profile_picture_id, date_added FROM players ORDER BY date_added DESC'
    );
    await conn.end();
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const player: NewPlayer = await request.json();
    
    // Validate required fields
    if (!player.player_tag || !player.real_name) {
      return NextResponse.json(
        { error: 'Player tag and real name are required' },
        { status: 400 }
      );
    }

    // Validate monkey_preference
    if (!Object.values(MonkeyType).includes(player.monkey_preference)) {
      return NextResponse.json(
        { error: 'Invalid monkey preference' },
        { status: 400 }
      );
    }

    // Validate profile_picture_id
    if (player.profile_picture_id < 0 || player.profile_picture_id > 99) {
      return NextResponse.json(
        { error: 'Invalid profile picture ID' },
        { status: 400 }
      );
    }

    const conn = await getDBConnection();
    
    // Check if player_tag already exists
    const [existing] = await conn.execute(
      'SELECT player_tag FROM players WHERE player_tag = ?',
      [player.player_tag]
    );
    
    if (Array.isArray(existing) && existing.length > 0) {
      await conn.end();
      return NextResponse.json(
        { error: 'Player tag already exists' },
        { status: 400 }
      );
    }

    // Insert new player
    await conn.execute(
      'INSERT INTO players (player_tag, real_name, monkey_preference, profile_picture_id) VALUES (?, ?, ?, ?)',
      [player.player_tag, player.real_name, player.monkey_preference, player.profile_picture_id]
    );
    
    await conn.end();
    
    return NextResponse.json(
      { message: 'Player created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
} 