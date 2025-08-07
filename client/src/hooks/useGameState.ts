import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface GameState {
  roundId: number;
  phase: 'waiting' | 'starting' | 'flying' | 'crashed';
  multiplier: number;
  startTime: number;
  duration: number;
  hash: string;
  countdown: number;
}

interface UserStats {
  totalWins: number;
  totalLosses: number;
  biggestWin: string;
  winRate: number;
}

interface Game {
  id: string;
  roundId: number;
  multiplier: string;
  hash: string;
  salt: string | null;
  startedAt: Date;
  crashedAt: Date | null;
}

export function useGameState(socket: WebSocket | null) {
  const [gameState, setGameState] = useState<GameState>({
    roundId: 127534,
    phase: 'waiting',
    multiplier: 1.00,
    startTime: 0,
    duration: 0,
    hash: 'abcd1234...',
    countdown: 2,
  });

  // Mock game state cycling when no WebSocket
  useEffect(() => {
    if (!socket) {
      console.log('No WebSocket - using mock game state');
      
      const interval = setInterval(() => {
        setGameState(prev => {
          if (prev.phase === 'waiting' && prev.countdown > 0) {
            return { ...prev, countdown: prev.countdown - 1 };
          } else if (prev.phase === 'waiting' && prev.countdown === 0) {
            return { ...prev, phase: 'flying', multiplier: 1.00, startTime: Date.now() };
          } else if (prev.phase === 'flying') {
            const elapsed = (Date.now() - prev.startTime) / 1000;
            // Much faster like Aviator: exponential growth for rapid acceleration
            const newMultiplier = 1 + Math.pow(elapsed * 0.8, 1.4); // Very fast exponential growth
            
            // Crash at random point between 1.5x and 5x
            if (newMultiplier > (1.5 + Math.random() * 3.5)) {
              return { 
                ...prev, 
                phase: 'crashed', 
                multiplier: parseFloat(newMultiplier.toFixed(2))
              };
            }
            
            return { ...prev, multiplier: parseFloat(newMultiplier.toFixed(2)) };
          } else if (prev.phase === 'crashed') {
            // Reset after 3 seconds
            setTimeout(() => {
              setGameState(prev => ({
                ...prev,
                roundId: prev.roundId + 1,
                phase: 'waiting',
                multiplier: 1.00,
                countdown: Math.random() < 0.5 ? 2 : 3, // Random 1.8-2.6s (using 2-3s for cleaner display)
                hash: Math.random().toString(36).substring(2, 12) + '...'
              }));
            }, 2000);
          }
          
          return prev;
        });
      }, 50); // Much faster updates - 20 times per second like Aviator

      return () => clearInterval(interval);
    }
  }, [socket]);

  const [userStats, setUserStats] = useState<UserStats>({
    totalWins: 0,
    totalLosses: 0,
    biggestWin: '0.00',
    winRate: 0,
  });

  // Fetch user stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/user/default-user/stats'],
    enabled: true,
  });

  // Fetch recent games
  const { data: recentGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/recent-games'],
    enabled: true,
  });

  useEffect(() => {
    if (statsData) {
      setUserStats(statsData as UserStats);
    }
  }, [statsData]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'gameState':
          setGameState(data.data);
          break;
        case 'gameCrashed':
          console.log('Game crashed:', data.data);
          break;
        case 'betPlaced':
          console.log('Bet placed:', data.data);
          break;
        case 'betCashedOut':
          console.log('Bet cashed out:', data.data);
          break;
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  return {
    gameState,
    userStats,
    recentGames,
  };
}
