export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  id: string;
}

export interface EnemyMissile extends Entity {
  targetX: number;
  targetY: number;
  speed: number;
  progress: number; // 0 to 1
}

export interface PlayerMissile extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  progress: number; // 0 to 1
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  life: number; // 0 to 1
}

export interface City extends Entity {
  active: boolean;
}

export interface Battery extends Entity {
  ammo: number;
  maxAmmo: number;
  active: boolean;
}

export type GameState = 'START' | 'PLAYING' | 'WON' | 'LOST';

export interface GameStats {
  score: number;
  level: number;
}
