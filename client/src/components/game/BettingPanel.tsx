import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface GameState {
  roundId: number;
  phase: 'waiting' | 'starting' | 'flying' | 'crashed';
  multiplier: number;
  startTime: number;
  duration: number;
  hash: string;
  countdown: number;
}

interface BettingPanelProps {
  gameState: GameState;
  socket: WebSocket | null;
  isConnected: boolean;
}

export default function BettingPanel({ gameState, socket, isConnected }: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState("100");
  const [autoCashOut, setAutoCashOut] = useState("");
  const [enableAutoCashOut, setEnableAutoCashOut] = useState(false);
  const [enableAutoBet, setEnableAutoBet] = useState(false);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [userBalance, setUserBalance] = useState(5000);
  const [currentBet, setCurrentBet] = useState<{amount: number, autoCashOut: number | null} | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Handle game crash - reset bet if user didn't cash out
  useEffect(() => {
    if (gameState.phase === 'crashed' && hasActiveBet && currentBet) {
      console.log('💥 GAME CRASHED - Bet lost');
      
      // Reset bet state after a delay to show the crash message
      setTimeout(() => {
        setHasActiveBet(false);
        setCurrentBet(null);
        
        toast({
          title: "Bet Lost",
          description: `Lost ₹${currentBet.amount.toFixed(2)} - crashed at ${gameState.multiplier.toFixed(2)}x`,
          variant: "destructive",
        });
      }, 1000);
    }
  }, [gameState.phase, hasActiveBet, currentBet, toast]);

  // Auto bet functionality
  useEffect(() => {
    if (enableAutoBet && gameState.phase === 'waiting' && !hasActiveBet) {
      const amount = parseFloat(betAmount);
      if (!isNaN(amount) && amount > 0 && amount <= userBalance) {
        // Auto place bet after a short delay
        setTimeout(() => {
          handlePlaceBet();
        }, 100);
      }
    }
  }, [gameState.phase, enableAutoBet, hasActiveBet, betAmount, userBalance]);

  const handlePlaceBet = () => {
    console.log('🚨 PLACING BET - Balance:', userBalance, 'Amount:', betAmount);
    
    const amount = parseFloat(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ₹${userBalance.toFixed(2)} available`,
        variant: "destructive",
      });
      return;
    }

    // Update balance immediately
    console.log('💰 UPDATING BALANCE:', userBalance, '->', userBalance - amount);
    const newBalance = userBalance - amount;
    setUserBalance(newBalance);
    setHasActiveBet(true);
    setCurrentBet({ amount: amount, autoCashOut: null });
    
    // Update header balance
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { balance: newBalance } 
    }));
    
    toast({
      title: "Bet Placed",
      description: `₹${amount.toFixed(2)} bet placed successfully`,
    });
  };

  const handleCashOut = () => {
    if (!currentBet || gameState.phase !== 'flying') return;

    const winnings = currentBet.amount * gameState.multiplier;
    console.log('💸 CASHING OUT - Winnings:', winnings, 'Multiplier:', gameState.multiplier);
    
    // Update balance with winnings
    const newBalance = userBalance + winnings;
    setUserBalance(newBalance);
    setHasActiveBet(false);
    setCurrentBet(null);
    
    // Update header balance
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { balance: newBalance } 
    }));
    
    toast({
      title: "Cashed Out!",
      description: `Cashed out at ${gameState.multiplier.toFixed(2)}x for ₹${winnings.toFixed(2)}`,
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-400">Current Balance</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent font-mono">₹ {userBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Bet Amount</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm bg-gray-700 border border-gray-600 border-r-0 rounded-l-lg">
                ₹
              </span>
              <Input
                type="number"
                placeholder="100"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-r-lg focus:ring-2 focus:ring-accent-green focus:border-accent-green text-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Auto Bet Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg backdrop-blur">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Auto Bet</span>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAutoBet}
                  onChange={(e) => setEnableAutoBet(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableAutoBet ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableAutoBet ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>
            {enableAutoBet && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full animate-pulse">
                AUTO
              </span>
            )}
          </div>

          {/* Place Bet Button */}
          {!hasActiveBet && gameState.phase === 'waiting' && !enableAutoBet && (
            <Button 
              className="w-full bg-accent-green hover:bg-green-600 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-105"
              onClick={handlePlaceBet}
            >
              <i className="fas fa-rocket mr-2"></i>
              Place Bet (₹ {parseFloat(betAmount || "0").toFixed(2)})
            </Button>
          )}

          {/* Cash Out Button */}
          {hasActiveBet && gameState.phase === 'flying' && currentBet && (
            <Button 
              className="w-full bg-accent-gold hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-105 animate-pulse"
              onClick={handleCashOut}
            >
              <i className="fas fa-hand-paper mr-2"></i>
              Cash Out ₹ {(currentBet.amount * gameState.multiplier).toFixed(2)} ({gameState.multiplier.toFixed(2)}x)
            </Button>
          )}

          {/* Status Messages */}
          {hasActiveBet && gameState.phase === 'waiting' && (
            <div className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-center">
              Bet Active - Waiting for Next Round
            </div>
          )}

          {hasActiveBet && gameState.phase === 'crashed' && (
            <div className="w-full bg-red-600 text-white font-bold py-3 rounded-lg text-center">
              Round Ended - Bet Lost
            </div>
          )}

          {enableAutoBet && gameState.phase === 'waiting' && !hasActiveBet && (
            <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg text-center animate-pulse">
              🤖 Auto Betting - Placing Bet...
            </div>
          )}

          {!hasActiveBet && gameState.phase !== 'waiting' && !enableAutoBet && (
            <div className="w-full bg-gray-600 text-gray-400 font-bold py-3 rounded-lg text-center">
              {gameState.phase === 'flying' ? 'No Active Bet' : 'Place Bet Next Round'}
            </div>
          )}

          {enableAutoBet && gameState.phase !== 'waiting' && !hasActiveBet && (
            <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg text-center">
              🤖 Auto Bet Active - Next Round
            </div>
          )}
        </div>
      </div>
    </div>
  );
}