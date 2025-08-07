import { EventEmitter } from 'events';
import { storage } from './storage';
import { generateHash, verifyHash } from './utils/hash';

export interface GameState {
  roundId: number;
  phase: 'waiting' | 'starting' | 'flying' | 'crashed';
  multiplier: number;
  startTime: number;
  duration: number;
  hash: string;
  salt?: string;
  countdown: number;
}

export class CrashEngine extends EventEmitter {
  private currentGame: GameState | null = null;
  private gameTimer: NodeJS.Timeout | null = null;
  private countdownTimer: NodeJS.Timeout | null = null;
  private roundIdCounter = 127534;
  private readonly WAIT_TIME = 10000; // 10 seconds between rounds
  private readonly MIN_GAME_TIME = 1000; // Minimum 1 second
  private readonly MAX_GAME_TIME = 30000; // Maximum 30 seconds

  constructor() {
    super();
    this.startNewRound();
  }

  private async startNewRound() {
    const roundId = ++this.roundIdCounter;
    const { hash, salt } = generateHash(roundId);
    
    this.currentGame = {
      roundId,
      phase: 'waiting',
      multiplier: 1.00,
      startTime: 0,
      duration: 0,
      hash,
      salt,
      countdown: this.WAIT_TIME / 1000,
    };

    // Store game in database
    await storage.createGame(roundId, hash);

    this.emit('gameStateUpdate', this.getPublicGameState());

    // Start countdown
    this.startCountdown();
  }

  private startCountdown() {
    this.countdownTimer = setInterval(() => {
      if (this.currentGame) {
        this.currentGame.countdown--;
        
        if (this.currentGame.countdown <= 0) {
          this.startFlying();
        } else {
          this.emit('gameStateUpdate', this.getPublicGameState());
        }
      }
    }, 1000);
  }

  private startFlying() {
    if (!this.currentGame) return;

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    this.currentGame.phase = 'flying';
    this.currentGame.startTime = Date.now();
    this.currentGame.multiplier = 1.00;

    // Generate crash point based on house edge
    const crashPoint = this.generateCrashPoint();
    const gameEndTime = this.currentGame.startTime + (crashPoint * 1000); // Convert to milliseconds

    this.emit('gameStateUpdate', this.getPublicGameState());

    // Update multiplier in real-time
    this.gameTimer = setInterval(() => {
      if (!this.currentGame || this.currentGame.phase !== 'flying') return;

      const elapsed = Date.now() - this.currentGame.startTime;
      const newMultiplier = 1 + (elapsed / 1000) * 0.1; // Increase by 0.1x per second

      this.currentGame.multiplier = Math.round(newMultiplier * 100) / 100;

      // Check for auto cash outs
      this.processAutoCashOuts();

      this.emit('gameStateUpdate', this.getPublicGameState());

      // Check if game should crash
      if (Date.now() >= gameEndTime) {
        this.crashGame();
      }
    }, 100); // Update every 100ms for smooth animation
  }

  private async processAutoCashOuts() {
    if (!this.currentGame) return;

    const gameFromDb = await storage.getGameByRoundId(this.currentGame.roundId);
    if (!gameFromDb) return;

    const activeBets = await storage.getActiveBetsByGameId(gameFromDb.id);
    
    for (const bet of activeBets) {
      if (bet.autoCashOut && parseFloat(bet.autoCashOut) <= this.currentGame.multiplier) {
        await this.cashOutBet(bet.id, bet.userId, this.currentGame.multiplier.toString());
      }
    }
  }

  private async cashOutBet(betId: string, userId: string, multiplier: string) {
    const bet = await storage.getBetsByUserId(userId);
    const targetBet = bet.find(b => b.id === betId && b.isActive);
    
    if (targetBet) {
      const winAmount = (parseFloat(targetBet.amount) * parseFloat(multiplier)).toFixed(2);
      await storage.updateBetCashOut(betId, multiplier, winAmount);
      
      // Update user balance
      const user = await storage.getUser(userId);
      if (user) {
        const newBalance = (parseFloat(user.balance) + parseFloat(winAmount)).toFixed(2);
        await storage.updateUserBalance(userId, newBalance);
      }

      this.emit('betCashedOut', {
        betId,
        userId,
        multiplier: parseFloat(multiplier),
        winAmount: parseFloat(winAmount),
      });
    }
  }

  private async crashGame() {
    if (!this.currentGame || this.currentGame.phase !== 'flying') return;

    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    const crashMultiplier = this.currentGame.multiplier;
    this.currentGame.phase = 'crashed';

    // Update game in database
    const gameFromDb = await storage.getGameByRoundId(this.currentGame.roundId);
    if (gameFromDb && this.currentGame.salt) {
      await storage.updateGameCrash(gameFromDb.id, crashMultiplier.toString(), this.currentGame.salt);
    }

    // Process all remaining active bets as losses
    if (gameFromDb) {
      const activeBets = await storage.getActiveBetsByGameId(gameFromDb.id);
      for (const bet of activeBets) {
        await storage.updateBetCashOut(bet.id, "0.00", "0.00");
      }
    }

    this.emit('gameCrashed', {
      roundId: this.currentGame.roundId,
      crashPoint: crashMultiplier,
    });

    this.emit('gameStateUpdate', this.getPublicGameState());

    // Start new round after delay
    setTimeout(() => {
      this.startNewRound();
    }, 3000);
  }

  private generateCrashPoint(): number {
    // House edge calculation - generates crash point with 1% house edge
    const r = Math.random();
    return Math.max(1, Math.floor((99 / (r * 100)) * 100) / 100);
  }

  public getPublicGameState(): Omit<GameState, 'salt'> {
    if (!this.currentGame) {
      return {
        roundId: 0,
        phase: 'waiting',
        multiplier: 1.00,
        startTime: 0,
        duration: 0,
        hash: '',
        countdown: 10,
      };
    }

    const { salt, ...publicState } = this.currentGame;
    return publicState;
  }

  public async placeBet(userId: string, amount: string, autoCashOut?: string): Promise<{ success: boolean; message: string; betId?: string }> {
    if (!this.currentGame || this.currentGame.phase !== 'waiting') {
      return { success: false, message: 'Betting is not available right now' };
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const betAmount = parseFloat(amount);
    const userBalance = parseFloat(user.balance);

    if (betAmount <= 0) {
      return { success: false, message: 'Bet amount must be greater than 0' };
    }

    if (betAmount > userBalance) {
      return { success: false, message: 'Insufficient balance' };
    }

    const gameFromDb = await storage.getGameByRoundId(this.currentGame.roundId);
    if (!gameFromDb) {
      return { success: false, message: 'Game not found' };
    }

    // Check if user already has an active bet for this round
    const existingBets = await storage.getBetsByUserId(userId);
    const hasActiveBet = existingBets.some(bet => bet.gameId === gameFromDb.id && bet.isActive);
    
    if (hasActiveBet) {
      return { success: false, message: 'You already have a bet placed for this round' };
    }

    // Deduct amount from user balance
    const newBalance = (userBalance - betAmount).toFixed(2);
    await storage.updateUserBalance(userId, newBalance);

    // Create bet
    const bet = await storage.createBet(userId, gameFromDb.id, {
      amount,
      autoCashOut,
    });

    this.emit('betPlaced', {
      userId,
      amount: betAmount,
      autoCashOut: autoCashOut ? parseFloat(autoCashOut) : null,
      roundId: this.currentGame.roundId,
    });

    return { success: true, message: 'Bet placed successfully', betId: bet.id };
  }

  public async manualCashOut(userId: string): Promise<{ success: boolean; message: string; winAmount?: number }> {
    if (!this.currentGame || this.currentGame.phase !== 'flying') {
      return { success: false, message: 'Cannot cash out right now' };
    }

    const gameFromDb = await storage.getGameByRoundId(this.currentGame.roundId);
    if (!gameFromDb) {
      return { success: false, message: 'Game not found' };
    }

    const activeBets = await storage.getActiveBetsByGameId(gameFromDb.id);
    const userBet = activeBets.find(bet => bet.userId === userId);

    if (!userBet) {
      return { success: false, message: 'No active bet found' };
    }

    const multiplier = this.currentGame.multiplier.toString();
    const winAmount = parseFloat((parseFloat(userBet.amount) * this.currentGame.multiplier).toFixed(2));

    await this.cashOutBet(userBet.id, userId, multiplier);

    return { success: true, message: 'Cashed out successfully', winAmount };
  }
}
