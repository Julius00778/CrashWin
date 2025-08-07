import { useState, useEffect } from "react";

interface LiveBet {
  id: string;
  username: string;
  amount: number;
  multiplier?: number;
  status: 'active' | 'cashed_out' | 'lost';
  avatar: string;
  timestamp: Date;
}

interface LiveBetsProps {
  gameState: {
    phase: 'waiting' | 'starting' | 'flying' | 'crashed';
    multiplier: number;
  };
}

export default function LiveBets({ gameState }: LiveBetsProps) {
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);

  // Mock live bets for demonstration
  useEffect(() => {
    if (gameState.phase === 'waiting') {
      // Generate some mock bets for the new round
      const mockBets: LiveBet[] = [
        {
          id: '1',
          username: 'CryptoKing',
          amount: 250,
          status: 'active',
          avatar: '👑',
          timestamp: new Date()
        },
        {
          id: '2', 
          username: 'LuckyPlayer',
          amount: 500,
          status: 'active',
          avatar: '🍀',
          timestamp: new Date()
        },
        {
          id: '3',
          username: 'DiamondHands',
          amount: 150,
          status: 'active',
          avatar: '💎',
          timestamp: new Date()
        },
        {
          id: '4',
          username: 'RocketMan',
          amount: 1000,
          status: 'active', 
          avatar: '🚀',
          timestamp: new Date()
        },
        {
          id: '5',
          username: 'MoonShot',
          amount: 300,
          status: 'active',
          avatar: '🌙',
          timestamp: new Date()
        }
      ];
      
      setLiveBets(mockBets);
    }
    
    if (gameState.phase === 'flying') {
      // Randomly cash out some bets
      setLiveBets(prev => prev.map(bet => {
        if (bet.status === 'active' && Math.random() < 0.1) { // 10% chance to cash out each update
          const cashOutMultiplier = gameState.multiplier - (Math.random() * 0.5); // Cash out slightly before current multiplier
          return {
            ...bet,
            status: 'cashed_out' as const,
            multiplier: Math.max(1.01, cashOutMultiplier)
          };
        }
        return bet;
      }));
    }
    
    if (gameState.phase === 'crashed') {
      // Mark remaining active bets as lost
      setLiveBets(prev => prev.map(bet => 
        bet.status === 'active' 
          ? { ...bet, status: 'lost' as const, multiplier: gameState.multiplier }
          : bet
      ));
    }
  }, [gameState.phase, gameState.multiplier]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-500/20';
      case 'cashed_out': return 'text-green-400 bg-green-500/20';
      case 'lost': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🎯';
      case 'cashed_out': return '✅';  
      case 'lost': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Live Bets ({liveBets.length})
        </h3>
        <div className="text-xs text-gray-400">
          {gameState.phase === 'flying' && `Current: ${gameState.multiplier.toFixed(2)}x`}
        </div>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {liveBets.map((bet) => (
          <div
            key={bet.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${getStatusColor(bet.status)} border border-gray-600/30`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-xl">{bet.avatar}</div>
              <div>
                <div className="font-semibold text-sm">{bet.username}</div>
                <div className="text-xs text-gray-400 font-mono">₹ {bet.amount.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right">
                {bet.status === 'cashed_out' && bet.multiplier && (
                  <>
                    <div className="text-sm font-bold text-green-400 font-mono">
                      ₹ {(bet.amount * bet.multiplier).toFixed(2)}
                    </div>
                    <div className="text-xs text-green-300 text-center">
                      {bet.multiplier.toFixed(2)}x
                    </div>
                  </>
                )}
                {bet.status === 'lost' && (
                  <>
                    <div className="text-sm font-bold text-red-400 font-mono">
                      -₹ {bet.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-red-300 text-center">
                      Lost
                    </div>
                  </>
                )}
                {bet.status === 'active' && (
                  <>
                    <div className="text-sm font-bold text-blue-400 font-mono">
                      ₹ {(bet.amount * gameState.multiplier).toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-300 text-center">
                      {gameState.multiplier.toFixed(2)}x
                    </div>
                  </>
                )}
              </div>
              <div className="text-lg">
                {getStatusIcon(bet.status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {liveBets.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <div className="text-3xl mb-2">🎲</div>
          <div>No active bets</div>
        </div>
      )}
    </div>
  );
}