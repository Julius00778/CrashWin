import { useEffect } from "react";
import Header from "@/components/layout/Header";
import CrashChart from "@/components/game/CrashChart";
import BettingPanel from "@/components/game/BettingPanel";
import LiveBets from "@/components/game/LiveBets";
import Sidebar from "@/components/sidebar/Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGameState } from "@/hooks/useGameState";
import { supabase } from "@/lib/supabase";

export default function CrashGame() {
  const { socket, isConnected } = useWebSocket();
  const { gameState, userStats, recentGames } = useGameState(socket);

  useEffect(() => {
    const authenticateUser = async () => {
      if (socket && isConnected) {
        // Authenticate with default user
        const user = await supabase.auth.getUser();
        socket.send(JSON.stringify({
          type: 'authenticate',
          userId: user?.data?.user?.id || 'guest'
        }));
      }
    };
    
    authenticateUser();
  }, [socket, isConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white font-['Space_Grotesk',sans-serif] relative overflow-hidden">
      {/* 3D Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-500 rounded-full blur-2xl animate-ping"></div>
      </div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>
      
      <div className="relative z-10">
        <Header />
      
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-4 gap-6">
        {/* Main Game Area */}
        <div className="flex-1 space-y-6">
          {/* Game Status Bar */}
          <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-accent-green animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Live Game' : 'Connecting...'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Round #{gameState.roundId}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {gameState.phase === 'waiting' ? 'Next round in' : 'Status'}
              </div>
              <div className="font-bold text-accent-gold">
                {gameState.phase === 'waiting' ? `${gameState.countdown}s` : gameState.phase}
              </div>
            </div>
          </div>

          {/* Main Game Chart */}
          <CrashChart gameState={gameState} />

          {/* Betting Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <BettingPanel 
                gameState={gameState} 
                socket={socket}
                isConnected={isConnected}
              />
            </div>
            <div>
              <LiveBets gameState={gameState} />
            </div>
          </div>

          {/* Recent Games History */}
          <div className="bg-secondary rounded-xl p-4">
            <h3 className="font-semibold mb-4 flex items-center">
              <i className="fas fa-history mr-2 text-accent-gold"></i>
              Recent Games
            </h3>
            <div className="flex flex-wrap gap-2" data-testid="recent-games-list">
              {recentGames.map((game) => {
                const multiplier = parseFloat(game.multiplier);
                const colorClass = multiplier >= 5.0 ? 'bg-accent-red text-white' : 
                                 multiplier >= 2.0 ? 'bg-accent-gold text-black' : 
                                 'bg-accent-green text-black';
                
                return (
                  <div 
                    key={game.id} 
                    className={`${colorClass} px-3 py-1 rounded-full text-sm font-bold`}
                    data-testid={`recent-game-${game.id}`}
                  >
                    {multiplier.toFixed(2)}x
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar socket={socket} userStats={userStats} />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-gray-700 px-4 py-2">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center space-y-1 text-accent-green" data-testid="nav-crash">
            <i className="fas fa-rocket text-lg"></i>
            <span className="text-xs">Crash</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400" data-testid="nav-dice">
            <i className="fas fa-dice text-lg"></i>
            <span className="text-xs">Dice</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400" data-testid="nav-chat">
            <i className="fas fa-comments text-lg"></i>
            <span className="text-xs">Chat</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400" data-testid="nav-profile">
            <i className="fas fa-user text-lg"></i>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
