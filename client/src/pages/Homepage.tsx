import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/auth/AuthModal";

export default function Homepage() {
  const [, setLocation] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handlePlayNow = () => {
    if (user) {
      setLocation("/game");
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-gold opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-green opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-red opacity-10 rounded-full blur-3xl animate-ping"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold bg-gradient-to-r from-accent-gold to-accent-green bg-clip-text text-transparent">
          CrashWin India
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm font-medium">{user.email}</span>
              <button
                onClick={handlePlayNow}
                className="bg-accent-green hover:bg-green-600 px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Play Game
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {setAuthMode('login'); setShowAuthModal(true);}}
                className="text-gray-300 hover:text-white transition-colors duration-300"
              >
                Login
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-accent-gold hover:bg-yellow-500 text-black px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-accent-gold via-accent-green to-accent-red bg-clip-text text-transparent animate-pulse">
            CRASH
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gray-200">
            The Ultimate Multiplier Game
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Watch the multiplier soar! Place your bet, watch it climb, and cash out before it crashes. 
            Will you be brave enough to wait for the big win?
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handlePlayNow}
              className="group relative overflow-hidden bg-gradient-to-r from-accent-green to-green-600 hover:from-green-500 hover:to-green-700 px-12 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-110 hover:shadow-2xl"
            >
              <span className="relative z-10">🚀 Play Now</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={() => document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-12 py-4 rounded-full text-xl font-semibold border-2 border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-black transition-all duration-300 transform hover:scale-110"
            >
              How to Play
            </button>
          </div>
        </div>

        {/* Live Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-accent-green">1,247</div>
            <div className="text-gray-400">Players Online</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-accent-gold">₹2,45,678</div>
            <div className="text-gray-400">Won Today</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-accent-red">127.5x</div>
            <div className="text-gray-400">Highest Multiplier</div>
          </div>
        </div>
      </main>

      {/* How to Play Section */}
      <section id="how-to-play" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-accent-gold to-accent-green bg-clip-text text-transparent">
            How to Play
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-accent-gold transition-colors duration-300">
              <div className="text-6xl mb-6">💰</div>
              <h4 className="text-2xl font-bold mb-4 text-accent-gold">1. Place Your Bet</h4>
              <p className="text-gray-400">Choose your bet amount and get ready for the action. Start small or go big!</p>
            </div>
            
            <div className="text-center p-8 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-accent-green transition-colors duration-300">
              <div className="text-6xl mb-6">🚀</div>
              <h4 className="text-2xl font-bold mb-4 text-accent-green">2. Watch It Rise</h4>
              <p className="text-gray-400">The multiplier starts climbing! Your winnings grow with every second.</p>
            </div>
            
            <div className="text-center p-8 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-accent-red transition-colors duration-300">
              <div className="text-6xl mb-6">💥</div>
              <h4 className="text-2xl font-bold mb-4 text-accent-red">3. Cash Out</h4>
              <p className="text-gray-400">Click cash out before it crashes! Timing is everything in this game.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
            Why Choose CrashWin India?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-gradient-to-br from-accent-green/20 to-green-600/20 rounded-xl border border-accent-green/30">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-xl font-bold mb-2">Lightning Fast</h4>
              <p className="text-gray-400">Instant deposits and withdrawals</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-accent-gold/20 to-yellow-600/20 rounded-xl border border-accent-gold/30">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-bold mb-2">100% Secure</h4>
              <p className="text-gray-400">Your funds are always protected</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-accent-red/20 to-red-600/20 rounded-xl border border-accent-red/30">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-bold mb-2">Provably Fair</h4>
              <p className="text-gray-400">Transparent and verifiable results</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30">
              <div className="text-4xl mb-4">💬</div>
              <h4 className="text-xl font-bold mb-2">Live Chat</h4>
              <p className="text-gray-400">Connect with players worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        onSuccess={() => {
          setShowAuthModal(false);
          if (authMode === 'login') {
            setLocation('/game');
          }
        }}
      />
    </div>
  );
}