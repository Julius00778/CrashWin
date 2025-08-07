import { useEffect, useRef, useState } from "react";

interface GameState {
  roundId: number;
  phase: 'waiting' | 'starting' | 'flying' | 'crashed';
  multiplier: number;
  startTime: number;
  duration: number;
  hash: string;
  countdown: number;
}

interface CrashChartProps {
  gameState: GameState;
}

interface Point {
  x: number;
  y: number;
}

export default function CrashChart({ gameState }: CrashChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [points, setPoints] = useState<Point[]>([]);
  const [crashed, setCrashed] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (gameState.phase === 'flying' && !gameStartTime) {
      setGameStartTime(Date.now());
      setPoints([]);
      setCrashed(false);
    } else if (gameState.phase === 'crashed' && !crashed) {
      setCrashed(true);
    } else if (gameState.phase === 'waiting') {
      setPoints([]);
      setCrashed(false);
      setGameStartTime(null);
    }
  }, [gameState.phase, gameStartTime, crashed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      const width = rect.width;
      const height = rect.height;

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid(ctx, width, height);

      if (gameState.phase === 'waiting') {
        drawWaitingState(ctx, width, height, gameState.countdown);
      } else if (gameState.phase === 'flying' || gameState.phase === 'crashed') {
        drawCrashCurve(ctx, width, height, gameState.multiplier, gameState.phase === 'crashed');
      }

      // Draw multiplier display
      drawMultiplierDisplay(ctx, width, height, gameState);
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      // Vertical lines
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let i = 0; i <= 8; i++) {
        const y = (height / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    const drawWaitingState = (ctx: CanvasRenderingContext2D, width: number, height: number, countdown: number) => {
      // Pulsing circle
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 50 + Math.sin(Date.now() / 500) * 10;

      const pulseGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      pulseGradient.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
      pulseGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');

      ctx.fillStyle = pulseGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Countdown text
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 48px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(countdown.toString(), centerX, centerY);

      // Waiting text
      ctx.fillStyle = '#d1d5db';
      ctx.font = '18px Inter';
      ctx.fillText('STARTING IN', centerX, centerY - 60);
    };

    const drawCrashCurve = (ctx: CanvasRenderingContext2D, width: number, height: number, multiplier: number, isCrashed: boolean) => {
      if (gameStartTime) {
        const elapsed = (Date.now() - gameStartTime) / 1000;
        const currentMultiplier = gameState.phase === 'flying' ? multiplier : multiplier;
        
        // Calculate curve points
        const maxTime = 30; // 30 seconds max display
        const maxMultiplier = 10; // 10x max display
        
        const x = Math.min((elapsed / maxTime) * width, width);
        const y = height - Math.min(((currentMultiplier - 1) / (maxMultiplier - 1)) * height * 0.8, height * 0.8);
        
        // Add current point to history
        if (gameState.phase === 'flying') {
          setPoints(prev => [...prev.slice(-100), { x, y }]);
        }

        // Draw the curve
        if (points.length > 1) {
          ctx.strokeStyle = isCrashed ? '#ef4444' : '#22c55e';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Create glowing effect
          ctx.shadowColor = isCrashed ? '#ef4444' : '#22c55e';
          ctx.shadowBlur = 15;

          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          
          if (!isCrashed && points.length > 0) {
            ctx.lineTo(x, y);
          }
          
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw animated rocket/plane if flying
          if (!isCrashed && points.length > 0) {
            const lastPoint = points[points.length - 1] || { x, y };
            drawAnimatedPlane(ctx, lastPoint.x, lastPoint.y, elapsed);
          }
        }

        // Draw crash explosion
        if (isCrashed && points.length > 0) {
          const crashPoint = points[points.length - 1];
          drawExplosion(ctx, crashPoint.x, crashPoint.y);
        }
      }
    };

    const drawAnimatedPlane = (ctx: CanvasRenderingContext2D, x: number, y: number, elapsed: number) => {
      ctx.save();
      
      // Calculate dynamic tilt and animation based on speed
      const speed = gameState.multiplier;
      const tilt = Math.min(speed * 0.08, 0.8); // More aggressive tilt
      const bounceEffect = Math.sin(elapsed * 5) * Math.min(speed * 0.5, 2); // Subtle bouncing at high speed
      ctx.translate(x, y + bounceEffect);
      ctx.rotate(tilt);
      
      // Plane body (sleeker design)
      const gradient = ctx.createLinearGradient(-15, 0, 15, 0);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(0.5, '#1d4ed8');
      gradient.addColorStop(1, '#1e40af');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Fuselage
      ctx.ellipse(0, 0, 20, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wings
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(-15, -8);
      ctx.lineTo(-12, -6);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(-15, 8);
      ctx.lineTo(-12, 6);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      
      // Tail
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.moveTo(-18, -3);
      ctx.lineTo(-25, -6);
      ctx.lineTo(-23, -4);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();
      
      // Engine trail (much more dramatic)
      const trailLength = Math.min(speed * 20, 120); // Longer trail
      const trailOpacity = Math.min(speed * 0.15, 0.9);
      
      // Multiple flame layers for intense effect
      for (let i = 0; i < 6; i++) {
        const hue = 60 - i * 10; // From yellow to red
        ctx.fillStyle = `hsla(${hue}, 100%, ${60 + i * 5}%, ${trailOpacity * (1 - i * 0.15)})`;
        ctx.beginPath();
        ctx.ellipse(-25 - i * 12, Math.sin(elapsed * 8 + i) * 2, trailLength * (1 - i * 0.12), 3 + i, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Propeller blur effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(20, 0, 8, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Speed lines (much more intense)
      if (speed > 1.5) {
        const intensity = Math.min((speed - 1.5) * 0.4, 1.0);
        ctx.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
        ctx.lineWidth = Math.min(speed * 0.3, 2);
        
        // Many more speed lines for dramatic effect
        for (let i = 0; i < 12; i++) {
          const offset = Math.sin(elapsed * 10 + i) * 3;
          ctx.beginPath();
          ctx.moveTo(-35 - i * 8, -8 + i * 1.5 + offset);
          ctx.lineTo(-60 - i * 12, -8 + i * 1.5 + offset);
          ctx.stroke();
        }
        
        // Additional particle effects at very high speed
        if (speed > 3) {
          for (let i = 0; i < 8; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * intensity})`;
            ctx.beginPath();
            ctx.arc(-80 + Math.random() * 40, -10 + Math.random() * 20, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    };

    const drawExplosion = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const time = (Date.now() % 1000) / 1000;
      const particles = 12;
      
      for (let i = 0; i < particles; i++) {
        const angle = (i / particles) * Math.PI * 2;
        const distance = time * 50;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        
        ctx.fillStyle = `rgba(239, 68, 68, ${1 - time})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3 * (1 - time), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawMultiplierDisplay = (ctx: CanvasRenderingContext2D, width: number, height: number, gameState: GameState) => {
      if (gameState.phase === 'flying' || gameState.phase === 'crashed') {
        const centerX = width / 2;
        const centerY = 80;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(centerX - 80, centerY - 30, 160, 60, 10);
        ctx.fill();

        // Multiplier text
        const color = gameState.phase === 'crashed' ? '#ef4444' : '#22c55e';
        ctx.fillStyle = color;
        ctx.font = 'bold 32px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Pulsing effect for flying
        if (gameState.phase === 'flying') {
          const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(scale, scale);
          ctx.fillText(`${gameState.multiplier.toFixed(2)}x`, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(`${gameState.multiplier.toFixed(2)}x`, centerX, centerY);
        }
      }
    };

    // Add roundRect polyfill
    if (!ctx.roundRect) {
      ctx.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }

    updateCanvas();

    if (gameState.phase === 'flying' || gameState.phase === 'waiting') {
      animationRef.current = requestAnimationFrame(updateCanvas);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, points, gameStartTime, crashed]);

  return (
    <div className="bg-secondary rounded-xl overflow-hidden shadow-2xl" data-testid="crash-chart">
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-accent-green animate-pulse"></div>
            <h2 className="text-xl font-bold text-white">Crash</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-400">
              <span className="text-gray-500">Round</span> #{gameState.roundId}
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Hash:</span> 
              <span className="text-accent-gold font-mono text-xs ml-1">
                {gameState.hash.substring(0, 8)}...
              </span>
            </div>
            {gameState.phase === 'waiting' && (
              <div className="text-sm text-accent-gold animate-pulse">
                <i className="fas fa-clock mr-1"></i>
                Starting in {gameState.countdown}s
              </div>
            )}
            {gameState.phase === 'crashed' && (
              <div className="text-sm text-red-500 font-bold animate-pulse">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                CRASHED
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="h-96 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)',
          }}
        />
        
        {/* Status overlay */}
        {gameState.phase === 'crashed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-sm">
            <div className="text-center animate-bounce">
              <div className="text-4xl mb-2">💥</div>
              <div className="text-3xl font-bold text-red-500 animate-pulse">
                CRASHED!
              </div>
              <div className="text-lg text-red-400 mt-1">
                at {gameState.multiplier.toFixed(2)}x
              </div>
            </div>
          </div>
        )}

        {/* Multiplier milestones */}
        <div className="absolute right-4 top-4 text-right text-xs text-gray-400">
          <div className="mb-1">🚀 1.5x</div>
          <div className="mb-1">🔥 2.0x</div>
          <div className="mb-1">💎 5.0x</div>
          <div className="mb-1">🌟 10x</div>
        </div>
      </div>
    </div>
  );
}