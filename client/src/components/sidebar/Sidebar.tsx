import { useQuery } from "@tanstack/react-query";
import LiveChat from "@/components/chat/LiveChat";

interface UserStats {
  totalWins: number;
  totalLosses: number;
  biggestWin: string;
  winRate: number;
}

interface SidebarProps {
  socket: WebSocket | null;
  userStats: UserStats;
}

export default function Sidebar({ socket, userStats }: SidebarProps) {
  const { data: topWinners } = useQuery({
    queryKey: ['/api/top-winners'],
    enabled: true,
  });

  return (
    <div className="w-full lg:w-80 space-y-6" data-testid="sidebar">
      {/* Live Chat */}
      <LiveChat socket={socket} />

      {/* Top Winners */}
      <div className="bg-secondary rounded-xl p-4" data-testid="top-winners">
        <h3 className="font-semibold mb-4 flex items-center">
          <i className="fas fa-trophy mr-2 text-accent-gold"></i>
          Top Winners Today
        </h3>
        <div className="space-y-3">
          {(topWinners as any[])?.slice(0, 3).map((winner: any, index: number) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medalColors = ['bg-accent-gold', 'bg-gray-400', 'bg-yellow-600'];
            
            return (
              <div 
                key={winner.user.id} 
                className="flex items-center justify-between p-3 bg-primary rounded-lg"
                data-testid={`top-winner-${index + 1}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 ${medalColors[index]} rounded-full flex items-center justify-center text-black text-xs font-bold`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" data-testid={`winner-name-${index + 1}`}>
                      {winner.user.username}
                    </div>
                    <div className="text-xs text-gray-400" data-testid={`winner-wins-${index + 1}`}>
                      {winner.totalWins} wins
                    </div>
                  </div>
                </div>
                <div className="text-accent-green font-bold" data-testid={`winner-amount-${index + 1}`}>
                  ₹{parseFloat(winner.totalWinnings).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Stats */}
      <div className="bg-secondary rounded-xl p-4" data-testid="user-stats">
        <h3 className="font-semibold mb-4 flex items-center">
          <i className="fas fa-chart-line mr-2 text-accent-gold"></i>
          My Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-green" data-testid="stat-total-wins">
              {userStats.totalWins}
            </div>
            <div className="text-xs text-gray-400">Total Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-red" data-testid="stat-total-losses">
              {userStats.totalLosses}
            </div>
            <div className="text-xs text-gray-400">Total Losses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-gold" data-testid="stat-biggest-win">
              {parseFloat(userStats.biggestWin).toFixed(2)}x
            </div>
            <div className="text-xs text-gray-400">Biggest Win</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white" data-testid="stat-win-rate">
              {userStats.winRate}%
            </div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
