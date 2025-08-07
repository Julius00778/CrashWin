import { type User, type InsertUser, type Game, type Bet, type ChatMessage, type InsertBet, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;
  
  // Game methods
  createGame(roundId: number, hash: string): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  getGameByRoundId(roundId: number): Promise<Game | undefined>;
  updateGameCrash(gameId: string, multiplier: string, salt: string): Promise<void>;
  getRecentGames(limit: number): Promise<Game[]>;
  
  // Bet methods
  createBet(userId: string, gameId: string, bet: InsertBet): Promise<Bet>;
  getBetsByGameId(gameId: string): Promise<Bet[]>;
  getBetsByUserId(userId: string): Promise<Bet[]>;
  updateBetCashOut(betId: string, cashOutAt: string, winAmount: string): Promise<void>;
  getActiveBetsByGameId(gameId: string): Promise<Bet[]>;
  
  // Chat methods
  createChatMessage(userId: string, message: InsertChatMessage): Promise<ChatMessage>;
  getRecentChatMessages(limit: number): Promise<ChatMessage[]>;
  
  // Stats methods
  getUserStats(userId: string): Promise<{ totalWins: number; totalLosses: number; biggestWin: string; winRate: number }>;
  getTopWinners(limit: number): Promise<Array<{ user: User; totalWins: number; totalWinnings: string }>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<string, Game>;
  private bets: Map<string, Bet>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.bets = new Map();
    this.chatMessages = new Map();
    
    // Create a default user for demo purposes
    const defaultUser: User = {
      id: "default-user",
      username: "Raj Kumar",
      password: "password",
      balance: "12580.50",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: "1000.00",
      avatar: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
    }
  }

  async createGame(roundId: number, hash: string): Promise<Game> {
    const id = randomUUID();
    const game: Game = {
      id,
      roundId,
      multiplier: "0.00",
      hash,
      salt: null,
      startedAt: new Date(),
      crashedAt: null,
    };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameByRoundId(roundId: number): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.roundId === roundId);
  }

  async updateGameCrash(gameId: string, multiplier: string, salt: string): Promise<void> {
    const game = this.games.get(gameId);
    if (game) {
      game.multiplier = multiplier;
      game.salt = salt;
      game.crashedAt = new Date();
      this.games.set(gameId, game);
    }
  }

  async getRecentGames(limit: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.crashedAt)
      .sort((a, b) => (b.crashedAt?.getTime() || 0) - (a.crashedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createBet(userId: string, gameId: string, bet: InsertBet): Promise<Bet> {
    const id = randomUUID();
    const newBet: Bet = {
      id,
      userId,
      gameId,
      amount: bet.amount,
      autoCashOut: bet.autoCashOut || null,
      cashOutAt: null,
      winAmount: null,
      isActive: true,
      placedAt: new Date(),
      cashedOutAt: null,
    };
    this.bets.set(id, newBet);
    return newBet;
  }

  async getBetsByGameId(gameId: string): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.gameId === gameId);
  }

  async getBetsByUserId(userId: string): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
  }

  async updateBetCashOut(betId: string, cashOutAt: string, winAmount: string): Promise<void> {
    const bet = this.bets.get(betId);
    if (bet) {
      bet.cashOutAt = cashOutAt;
      bet.winAmount = winAmount;
      bet.isActive = false;
      bet.cashedOutAt = new Date();
      this.bets.set(betId, bet);
    }
  }

  async getActiveBetsByGameId(gameId: string): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.gameId === gameId && bet.isActive);
  }

  async createChatMessage(userId: string, message: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const chatMessage: ChatMessage = {
      id,
      userId,
      message: message.message,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }

  async getRecentChatMessages(limit: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getUserStats(userId: string): Promise<{ totalWins: number; totalLosses: number; biggestWin: string; winRate: number }> {
    const userBets = Array.from(this.bets.values()).filter(bet => bet.userId === userId && !bet.isActive);
    const totalWins = userBets.filter(bet => bet.winAmount && parseFloat(bet.winAmount) > 0).length;
    const totalLosses = userBets.filter(bet => !bet.winAmount || parseFloat(bet.winAmount) === 0).length;
    const biggestWin = userBets.reduce((max, bet) => {
      if (bet.cashOutAt) {
        const multiplier = parseFloat(bet.cashOutAt);
        return multiplier > parseFloat(max) ? bet.cashOutAt : max;
      }
      return max;
    }, "0.00");
    const winRate = totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;
    
    return { totalWins, totalLosses, biggestWin, winRate };
  }

  async getTopWinners(limit: number): Promise<Array<{ user: User; totalWins: number; totalWinnings: string }>> {
    const userWinnings = new Map<string, { totalWins: number; totalWinnings: number }>();
    
    Array.from(this.bets.values())
      .filter(bet => bet.winAmount && parseFloat(bet.winAmount) > 0)
      .forEach(bet => {
        const current = userWinnings.get(bet.userId) || { totalWins: 0, totalWinnings: 0 };
        current.totalWins += 1;
        current.totalWinnings += parseFloat(bet.winAmount!);
        userWinnings.set(bet.userId, current);
      });

    return Array.from(userWinnings.entries())
      .map(([userId, stats]) => ({
        user: this.users.get(userId)!,
        totalWins: stats.totalWins,
        totalWinnings: stats.totalWinnings.toFixed(2),
      }))
      .filter(entry => entry.user)
      .sort((a, b) => parseFloat(b.totalWinnings) - parseFloat(a.totalWinnings))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
