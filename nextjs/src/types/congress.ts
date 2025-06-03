export enum Difficulty {
  Beginner = 'Beginner',
  Advanced = 'Advanced',
  Expert = 'Expert',
  Master = 'Master'
}

import { MonkeyType } from './player';

export interface Congress {
  congress_id: number;
  name: string;
  date: string;
  location: string | null;
  notes: string | null;
  players?: string[]; // player_tags
}

export interface NewCongress {
  name: string;
  date: string;
  location?: string;
  notes?: string;
  player_tags: string[];
}

export interface Round {
  round_id: number;
  congress_id: number;
  difficulty: Difficulty;
  round_order: number;
  players: RoundPlayer[];
}

export interface RoundPlayer {
  player_tag: string;
  stage_reached: number;
  lives_lost: number;
  extra_stages: number;
  monkey_used: MonkeyType;
  tiebreaker_points: number | null;
  score: number | null;
  final_rank: number | null;
} 