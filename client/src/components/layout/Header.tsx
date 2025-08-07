// ✅ FILE: client/src/components/layout/Header.tsx

import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import WalletModal from "@/components/wallet/WalletModal";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();
  const [showWallet, setShowWallet] = useState(false);
  const [balance, setBalance] = useState(5000);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // Listen for balance updates from betting panel
    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail.balance);
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLocation("/");
  };

  const handleTransaction = (type: 'deposit' | 'withdraw', amount: number) => {
    let newBalance: number;
    if (type === 'deposit') {
      setBalance(prev => {
        newBalance = prev + amount;
        return newBalance;
      });
    } else {
      setBalance(prev => {
        newBalance = prev - amount;
        return newBalance;
      });
    }
    
    // Dispatch balance update immediately with the new balance
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('walletTransaction', { 
        detail: { type, amount, newBalance } 
      }));
    }, 0);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-purple-900/90 via-blue-900/90 to-indigo-900/90 text-white backdrop-blur-md border-b border-purple-500/20">
      <Link to="/" className="flex items-center space-x-3 group">
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
            🚀
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent font-['Space_Grotesk']">
            CrashWin India
          </span>
          <span className="text-xs text-purple-300 font-medium">
            🎯 Live Gaming
          </span>
        </div>
      </Link>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <button 
              onClick={() => setShowWallet(true)}
              className="text-sm font-medium bg-gradient-to-r from-purple-800/50 to-pink-800/50 hover:from-purple-700/60 hover:to-pink-700/60 backdrop-blur-sm border border-purple-500/30 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-wallet text-purple-300 group-hover:text-pink-300 transition-colors"></i>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-purple-300">Balance</span>
                  <span className="text-sm font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent" id="user-balance">
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </button>
            <span className="text-sm font-medium">
              {user.email || "User"}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              Logout
            </button>
          </>
        ) : null}
      </div>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWallet}
        onClose={() => setShowWallet(false)}
        currentBalance={balance}
        onTransaction={handleTransaction}
      />
    </header>
  );
}
