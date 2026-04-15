/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, MousePointer2, Keyboard, Play, RotateCcw, ArrowLeft, X } from 'lucide-react';

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const INITIAL_BALL_SPEED = 5;
const SPEED_INCREMENT = 0.2;
const AI_SPEED = 4.5;

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [winner, setWinner] = useState<string | null>(null);

  // Game objects refs to avoid re-renders during loop
  const playerY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const aiY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const ball = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED,
    speed: INITIAL_BALL_SPEED
  });

  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        playerY.current = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, mouseY - PADDLE_HEIGHT / 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const resetBall = (direction: number) => {
    ball.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: direction * INITIAL_BALL_SPEED,
      dy: (Math.random() - 0.5) * 10,
      speed: INITIAL_BALL_SPEED
    };
  };

  const update = () => {
    if (gameState !== 'PLAYING') return;

    // Player Movement (Keyboard)
    if (keys.current['ArrowUp']) playerY.current = Math.max(0, playerY.current - 8);
    if (keys.current['ArrowDown']) playerY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerY.current + 8);

    // AI Movement
    const aiCenter = aiY.current + PADDLE_HEIGHT / 2;
    if (aiCenter < ball.current.y - 10) {
      aiY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, aiY.current + AI_SPEED);
    } else if (aiCenter > ball.current.y + 10) {
      aiY.current = Math.max(0, aiY.current - AI_SPEED);
    }

    // Ball Movement
    ball.current.x += ball.current.dx;
    ball.current.y += ball.current.dy;

    // Wall Collision (Top/Bottom)
    if (ball.current.y - BALL_SIZE / 2 <= 0 || ball.current.y + BALL_SIZE / 2 >= CANVAS_HEIGHT) {
      ball.current.dy *= -1;
    }

    // Paddle Collision (Player)
    if (
      ball.current.x - BALL_SIZE / 2 <= PADDLE_WIDTH &&
      ball.current.y >= playerY.current &&
      ball.current.y <= playerY.current + PADDLE_HEIGHT
    ) {
      // Calculate hit angle
      const relativeIntersectY = (playerY.current + PADDLE_HEIGHT / 2) - ball.current.y;
      const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
      const bounceAngle = normalizedIntersectY * (Math.PI / 4);

      ball.current.speed += SPEED_INCREMENT;
      ball.current.dx = ball.current.speed * Math.cos(bounceAngle);
      ball.current.dy = ball.current.speed * -Math.sin(bounceAngle);
    }

    // Paddle Collision (AI)
    if (
      ball.current.x + BALL_SIZE / 2 >= CANVAS_WIDTH - PADDLE_WIDTH &&
      ball.current.y >= aiY.current &&
      ball.current.y <= aiY.current + PADDLE_HEIGHT
    ) {
      const relativeIntersectY = (aiY.current + PADDLE_HEIGHT / 2) - ball.current.y;
      const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2);
      const bounceAngle = normalizedIntersectY * (Math.PI / 4);

      ball.current.speed += SPEED_INCREMENT;
      ball.current.dx = -ball.current.speed * Math.cos(bounceAngle);
      ball.current.dy = ball.current.speed * -Math.sin(bounceAngle);
    }

    // Scoring
    if (ball.current.x < 0) {
      setScore(prev => {
        const newScore = { ...prev, ai: prev.ai + 1 };
        if (newScore.ai >= 5) {
          setGameState('GAME_OVER');
          setWinner('COMPUTER');
        } else {
          resetBall(1);
        }
        return newScore;
      });
    } else if (ball.current.x > CANVAS_WIDTH) {
      setScore(prev => {
        const newScore = { ...prev, player: prev.player + 1 };
        if (newScore.player >= 5) {
          setGameState('GAME_OVER');
          setWinner('PLAYER');
        } else {
          resetBall(-1);
        }
        return newScore;
      });
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center Line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glow Effect
    ctx.shadowBlur = 15;

    // Player Paddle
    ctx.fillStyle = '#00FFFF';
    ctx.shadowColor = '#00FFFF';
    ctx.fillRect(0, playerY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

    // AI Paddle
    ctx.fillStyle = '#FF00FF';
    ctx.shadowColor = '#FF00FF';
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, aiY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      update();
      draw(ctx);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  const startGame = () => {
    setScore({ player: 0, ai: 0 });
    setWinner(null);
    resetBall(1);
    setGameState('PLAYING');
  };

  const exitToMenu = () => {
    setGameState('START');
    setScore({ player: 0, ai: 0 });
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-sans text-white overflow-hidden">
      {/* Navigation Bar */}
      <div className="w-full max-w-[800px] flex justify-between items-center mb-4 px-4 h-12">
        <AnimatePresence>
          {gameState !== 'START' && (
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              onClick={exitToMenu}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </motion.button>
          )}
        </AnimatePresence>
        
        {gameState === 'PLAYING' && (
          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            onClick={exitToMenu}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-pink-500 transition-colors"
          >
            Exit
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Header / Scoreboard */}
      <div className="w-full max-w-[800px] flex justify-between items-end mb-8 px-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold mb-1">Player</span>
          <span className="text-6xl font-black tracking-tighter tabular-nums leading-none">{score.player}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-widest uppercase italic text-white/20 mb-2">Neon Pong</h1>
          <div className="h-[1px] w-24 bg-white/10" />
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-[0.2em] text-pink-500 font-bold mb-1">Computer</span>
          <span className="text-6xl font-black tracking-tighter tabular-nums leading-none">{score.ai}</span>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative group">
        {/* Decorative Borders */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block cursor-none"
          />

          {/* Overlays */}
          <AnimatePresence>
            {gameState === 'START' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
                    Ready to Play?
                  </h2>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Control your paddle with the mouse or arrow keys. First to 5 points wins.
                  </p>
                  
                  <div className="flex gap-8 mb-12 justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-full bg-white/5 border border-white/10">
                        <MousePointer2 className="w-6 h-6 text-cyan-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Mouse</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-full bg-white/5 border border-white/10">
                        <Keyboard className="w-6 h-6 text-pink-500" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Arrows</span>
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    className="group relative px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Play className="w-4 h-4 fill-current" />
                      Start Game
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {gameState === 'GAME_OVER' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-6 p-6 rounded-full bg-white/5 border border-white/10">
                    <Trophy className={`w-16 h-16 ${winner === 'PLAYER' ? 'text-yellow-400' : 'text-white/20'}`} />
                  </div>
                  
                  <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-2">
                    {winner === 'PLAYER' ? 'You Won!' : 'Game Over'}
                  </h2>
                  <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-bold mb-12">
                    Final Score: {score.player} - {score.ai}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={startGame}
                      className="flex items-center justify-center gap-3 px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full hover:bg-cyan-400 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Play Again
                    </button>
                    <button
                      onClick={exitToMenu}
                      className="flex items-center justify-center gap-3 px-10 py-5 bg-white/10 text-white font-black uppercase tracking-widest text-sm rounded-full hover:bg-white/20 transition-colors border border-white/10"
                    >
                      <X className="w-5 h-5" />
                      Exit to Menu
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 flex gap-12 text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span>60 FPS Rendering</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
          <span>Adaptive AI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          <span>Vector Physics</span>
        </div>
      </div>
    </div>
  );
}

