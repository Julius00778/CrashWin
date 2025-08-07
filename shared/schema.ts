import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  password: text("password"),
  email: text("email").notNull().unique(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  phone: text("phone").notNull(),
  date_of_birth: text("date_of_birth"),
  city: text("city"),
  country: text("country"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("5000.00"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: integer("round_id").notNull().unique(),
  multiplier: decimal("multiplier", { precision: 10, scale: 2 }).notNull(),
  hash: text("hash").notNull(),
  salt: text("salt"),
  startedAt: timestamp("started_at").defaultNow(),
  crashedAt: timestamp("crashed_at"),
});

export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  gameId: varchar("game_id").notNull().references(() => games.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  autoCashOut: decimal("auto_cash_out", { precision: 10, scale: 2 }),
  cashOutAt: decimal("cash_out_at", { precision: 10, scale: 2 }),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  placedAt: timestamp("placed_at").defaultNow(),
  cashedOutAt: timestamp("cashed_out_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  first_name: true,
  last_name: true,
  phone: true,
  date_of_birth: true,
  city: true,
  country: true,
});

export const insertBetSchema = createInsertSchema(bets).pick({
  amount: true,
  autoCashOut: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
