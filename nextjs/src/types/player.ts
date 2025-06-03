export enum MonkeyType {
  AiAi = 1,
  MeeMee = 2,
  Baby = 3,
  GonGon = 4
}

export const MONKEY_NAMES: Record<MonkeyType, string> = {
  [MonkeyType.AiAi]: 'AiAi',
  [MonkeyType.MeeMee]: 'MeeMee',
  [MonkeyType.Baby]: 'Baby',
  [MonkeyType.GonGon]: 'GonGon'
};

export interface Player {
  player_tag: string;
  real_name: string;
  monkey_preference: MonkeyType;
  profile_picture_id: number;
  date_added: string;
}

export interface NewPlayer {
  player_tag: string;
  real_name: string;
  monkey_preference: MonkeyType;
  profile_picture_id: number;
} 