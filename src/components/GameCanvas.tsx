import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Point, 
  EnemyMissile, 
  PlayerMissile, 
  Explosion, 
  City, 
  Battery, 
  GameState 
} from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  CITY_COUNT, 
  BATTERY_COUNT, 
  AMMO_LEFT_RIGHT, 
  AMMO_MIDDLE, 
  WIN_SCORE, 
  SCORE_PER_KILL, 
  EXPLOSION_MAX_RADIUS, 
  EXPLOSION_DURATION, 
  ENEMY_SPEED_BASE, 
  PLAYER_MISSILE_SPEED,
  COLORS
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  lang: 'en' | 'zh';
  onScoreUpdate: (score: number) => void;
  onGameEnd: (result: 'WON' | 'LOST') => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, lang, onScoreUpdate, onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);

  // Game Entities
  const citiesRef = useRef<City[]>([]);
  const batteriesRef = useRef<Battery[]>([]);
  const enemyMissilesRef = useRef<EnemyMissile[]>([]);
  const playerMissilesRef = useRef<PlayerMissile[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const scoreRef = useRef(0);

  const [displayScore, setDisplayScore] = useState(0);

  // Initialize game objects
  const initGame = useCallback(() => {
    scoreRef.current = 0;
    setDisplayScore(0);
    onScoreUpdate(0);

    // Cities
    const cities: City[] = [];
    const citySpacing = GAME_WIDTH / (CITY_COUNT + BATTERY_COUNT + 1);
    
    // Batteries at 1/4, 2/4, 3/4 positions roughly
    const batteryIndices = [0, Math.floor((CITY_COUNT + BATTERY_COUNT) / 2), CITY_COUNT + BATTERY_COUNT - 1];
    
    let cityCounter = 0;
    let batteryCounter = 0;

    for (let i = 0; i < CITY_COUNT + BATTERY_COUNT; i++) {
      const x = (i + 1) * citySpacing;
      const y = GAME_HEIGHT - 20;
      
      if (batteryIndices.includes(i)) {
        const maxAmmo = batteryCounter === 1 ? AMMO_MIDDLE : AMMO_LEFT_RIGHT;
        batteriesRef.current[batteryCounter] = {
          id: `battery-${batteryCounter}`,
          x, y, active: true, ammo: maxAmmo, maxAmmo
        };
        batteryCounter++;
      } else {
        cities: cities.push({
          id: `city-${cityCounter}`,
          x, y, active: true
        });
        cityCounter++;
      }
    }
    citiesRef.current = cities;
    enemyMissilesRef.current = [];
    playerMissilesRef.current = [];
    explosionsRef.current = [];
  }, [onScoreUpdate]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      initGame();
    }
  }, [gameState, initGame]);

  const spawnEnemyMissile = useCallback(() => {
    const targets = [
      ...citiesRef.current.filter(c => c.active),
      ...batteriesRef.current.filter(b => b.active)
    ];
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const startX = Math.random() * GAME_WIDTH;
    
    const newMissile: EnemyMissile = {
      id: Math.random().toString(36).substr(2, 9),
      x: startX,
      y: 0,
      targetX: target.x,
      targetY: target.y,
      speed: ENEMY_SPEED_BASE + Math.random() * 0.0005,
      progress: 0
    };
    enemyMissilesRef.current.push(newMissile);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const targetX = (clientX - rect.left) * scaleX;
    const targetY = (clientY - rect.top) * scaleY;

    // Find nearest active battery with ammo
    let nearestBattery: Battery | null = null;
    let minDistance = Infinity;

    batteriesRef.current.forEach(b => {
      if (b.active && b.ammo > 0) {
        const dist = Math.sqrt(Math.pow(b.x - targetX, 2) + Math.pow(b.y - targetY, 2));
        if (dist < minDistance) {
          minDistance = dist;
          nearestBattery = b;
        }
      }
    });

    if (nearestBattery) {
      (nearestBattery as Battery).ammo -= 1;
      const newPlayerMissile: PlayerMissile = {
        id: Math.random().toString(36).substr(2, 9),
        x: nearestBattery.x,
        y: nearestBattery.y,
        startX: nearestBattery.x,
        startY: nearestBattery.y,
        targetX,
        targetY,
        speed: PLAYER_MISSILE_SPEED,
        progress: 0
      };
      playerMissilesRef.current.push(newPlayerMissile);
    }
  };

  const update = useCallback((deltaTime: number) => {
    if (gameState !== 'PLAYING') return;

    // Spawn enemies
    if (Math.random() < 0.02) {
      spawnEnemyMissile();
    }

    // Update Enemy Missiles
    enemyMissilesRef.current = enemyMissilesRef.current.filter(m => {
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        // Hit target
        const city = citiesRef.current.find(c => Math.abs(c.x - m.targetX) < 1 && Math.abs(c.y - m.targetY) < 1);
        if (city) city.active = false;
        const battery = batteriesRef.current.find(b => Math.abs(b.x - m.targetX) < 1 && Math.abs(b.y - m.targetY) < 1);
        if (battery) battery.active = false;
        
        // Create impact explosion
        explosionsRef.current.push({
          id: `exp-${Math.random()}`,
          x: m.targetX,
          y: m.targetY,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          life: 0
        });

        return false;
      }
      
      const moveDist = 1.2 * (deltaTime / 16);
      const angle = Math.atan2(dy, dx);
      m.x += Math.cos(angle) * moveDist;
      m.y += Math.sin(angle) * moveDist;

      return true;
    });

    // Update Player Missiles
    playerMissilesRef.current = playerMissilesRef.current.filter(m => {
      const dx = m.targetX - m.x;
      const dy = m.targetY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 10) {
        // Explode
        explosionsRef.current.push({
          id: `exp-${Math.random()}`,
          x: m.targetX,
          y: m.targetY,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          life: 0
        });
        return false;
      }

      const moveDist = 10 * (deltaTime / 16);
      const angle = Math.atan2(dy, dx);
      m.x += Math.cos(angle) * moveDist;
      m.y += Math.sin(angle) * moveDist;
      return true;
    });

    // Update Explosions
    explosionsRef.current = explosionsRef.current.filter(e => {
      e.life += deltaTime / EXPLOSION_DURATION;
      // Sinusoidal radius for expand and contract
      e.radius = Math.sin(e.life * Math.PI) * e.maxRadius;
      
      // Check collision with enemy missiles
      enemyMissilesRef.current = enemyMissilesRef.current.filter(m => {
        const dist = Math.sqrt(Math.pow(m.x - e.x, 2) + Math.pow(m.y - e.y, 2));
        if (dist < e.radius) {
          scoreRef.current += SCORE_PER_KILL;
          setDisplayScore(scoreRef.current);
          onScoreUpdate(scoreRef.current);
          
          // Chain explosion
          explosionsRef.current.push({
            id: `exp-chain-${Math.random()}`,
            x: m.x,
            y: m.y,
            radius: 0,
            maxRadius: EXPLOSION_MAX_RADIUS,
            life: 0
          });
          return false;
        }
        return true;
      });

      return e.life < 1;
    });

    // Check Win/Loss
    if (scoreRef.current >= WIN_SCORE) {
      onGameEnd('WON');
    }

    const activeBatteries = batteriesRef.current.filter(b => b.active);
    if (activeBatteries.length === 0) {
      onGameEnd('LOST');
    }
  }, [gameState, spawnEnemyMissile, onScoreUpdate, onGameEnd]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Cities (Village Houses)
    citiesRef.current.forEach(c => {
      if (c.active) {
        ctx.fillStyle = COLORS.city;
        ctx.beginPath();
        ctx.moveTo(c.x - 15, c.y + 10);
        ctx.lineTo(c.x, c.y - 15);
        ctx.lineTo(c.x + 15, c.y + 10);
        ctx.fill();
        ctx.fillRect(c.x - 12, c.y, 24, 10);
        
        // Village symbol
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(c.x, c.y + 2, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw Batteries (Defense Scrolls)
    batteriesRef.current.forEach(b => {
      if (b.active) {
        ctx.fillStyle = COLORS.battery;
        // Scroll body
        ctx.fillRect(b.x - 10, b.y - 25, 20, 40);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(b.x - 8, b.y - 20, 16, 30);
        
        // Scroll ends
        ctx.fillStyle = '#451a03';
        ctx.fillRect(b.x - 12, b.y - 25, 24, 5);
        ctx.fillRect(b.x - 12, b.y + 10, 24, 5);
        
        // Chakra bar
        const ammoPct = b.ammo / b.maxAmmo;
        ctx.fillStyle = '#374151';
        ctx.fillRect(b.x - 15, b.y + 20, 30, 4);
        ctx.fillStyle = ammoPct > 0.2 ? '#ef4444' : '#991b1b';
        ctx.fillRect(b.x - 15, b.y + 20, 30 * ammoPct, 4);
      }
    });

    // Draw Enemy Missiles (Kunai)
    enemyMissilesRef.current.forEach(m => {
      ctx.save();
      ctx.translate(m.x, m.y);
      const angle = Math.atan2(m.targetY - m.y, m.targetX - m.x);
      ctx.rotate(angle + Math.PI / 2);
      
      // Kunai body
      ctx.fillStyle = COLORS.enemy;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(3, 2);
      ctx.lineTo(-3, 2);
      ctx.closePath();
      ctx.fill();
      
      // Kunai handle
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 6);
      ctx.stroke();
      
      ctx.restore();
      
      // Trail
      ctx.strokeStyle = 'rgba(75, 85, 99, 0.2)';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - Math.cos(angle) * 30, m.y - Math.sin(angle) * 30);
      ctx.stroke();
    });

    // Draw Player Missiles (Shuriken/Fireball)
    playerMissilesRef.current.forEach(m => {
      // Trail
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.startX, m.startY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      
      // Shuriken head
      ctx.save();
      ctx.translate(m.x, m.y);
      const spin = Date.now() * 0.01;
      ctx.rotate(spin); // Spin
      
      // Shuriken blades
      ctx.fillStyle = '#94a3b8';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 3);
        ctx.fill();
      }

      // Explosive Tag (起爆符) attached to shuriken
      ctx.rotate(-spin * 0.5); // Counter-rotate slightly for a "fluttering" effect or just keep it simple
      ctx.fillStyle = '#fef3c7'; // Light yellow paper
      ctx.fillRect(-2, 4, 4, 12);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-2, 4, 4, 12);
      // Tiny "Explosion" kanji or seal scribble
      ctx.fillStyle = '#dc2626';
      ctx.font = '6px serif';
      ctx.fillText('爆', -3, 12);
      
      ctx.restore();
      
      // Target marker (Seal symbol)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(m.targetX, m.targetY, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m.targetX - 4, m.targetY);
      ctx.lineTo(m.targetX + 4, m.targetY);
      ctx.moveTo(m.targetX, m.targetY - 4);
      ctx.lineTo(m.targetX, m.targetY + 4);
      ctx.stroke();
    });

    // Draw Explosions
    explosionsRef.current.forEach(e => {
      const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, COLORS.explosion);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    });

  }, []);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      update(deltaTime);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <div className="relative w-full aspect-[4/3] max-w-4xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-zinc-800">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="w-full h-full cursor-crosshair touch-none"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
          <p className="text-xs text-zinc-400 uppercase tracking-widest">{lang === 'en' ? 'Merit' : '功勋'}</p>
          <p className="text-2xl font-mono font-bold text-orange-400">{displayScore}</p>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-right">
          <p className="text-xs text-zinc-400 uppercase tracking-widest">{lang === 'en' ? 'Chakra' : '查克拉'}</p>
          <p className="text-2xl font-mono font-bold text-red-400">{WIN_SCORE}</p>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
