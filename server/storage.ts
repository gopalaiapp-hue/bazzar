import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<schema.User | undefined>;
  getUserByPhone(phone: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUser(id: string, data: Partial<schema.InsertUser>): Promise<schema.User>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;

  // OTP
  createOtp(otp: schema.InsertOtp): Promise<schema.Otp>;
  getOtp(phone: string): Promise<schema.Otp | undefined>;
  deleteOtp(id: number): Promise<void>;

  // Pockets
  getUserPockets(userId: string): Promise<schema.Pocket[]>;
  createPocket(pocket: schema.InsertPocket): Promise<schema.Pocket>;
  updatePocket(id: number, data: Partial<schema.InsertPocket>): Promise<schema.Pocket>;

  // Transactions
  getUserTransactions(userId: string, limit?: number): Promise<schema.Transaction[]>;
  createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction>;

  // Lena Dena
  getUserLenaDena(userId: string): Promise<schema.LenaDena[]>;
  createLenaDena(entry: schema.InsertLenaDena): Promise<schema.LenaDena>;
  updateLenaDena(id: number, data: Partial<schema.InsertLenaDena>): Promise<schema.LenaDena>;

  // Budgets
  getUserBudgets(userId: string, month: string): Promise<schema.Budget[]>;
  createBudget(budget: schema.InsertBudget): Promise<schema.Budget>;
  updateBudget(id: number, data: Partial<schema.InsertBudget>): Promise<schema.Budget>;

  // Family
  getUserFamilyMembers(userId: string): Promise<schema.FamilyMember[]>;
  createFamilyMember(member: schema.InsertFamilyMember): Promise<schema.FamilyMember>;

  // Goals
  getUserGoals(userId: string): Promise<schema.Goal[]>;
  createGoal(goal: schema.InsertGoal): Promise<schema.Goal>;
  updateGoal(id: number, data: Partial<schema.InsertGoal>): Promise<schema.Goal>;

  // Tax Data
  getTaxData(userId: string, year: string): Promise<schema.TaxData | undefined>;
  createTaxData(data: schema.InsertTaxData): Promise<schema.TaxData>;
  updateTaxData(id: number, data: Partial<schema.InsertTaxData>): Promise<schema.TaxData>;
}

import bcrypt from "bcryptjs";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<schema.User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<schema.User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<schema.InsertUser>): Promise<schema.User> {
    const result = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  // OTP
  async createOtp(otp: schema.InsertOtp): Promise<schema.Otp> {
    const result = await db.insert(schema.otps).values(otp).returning();
    return result[0];
  }

  async getOtp(phone: string): Promise<schema.Otp | undefined> {
    const result = await db.select().from(schema.otps)
      .where(eq(schema.otps.phone, phone))
      .orderBy(desc(schema.otps.createdAt))
      .limit(1);
    return result[0];
  }

  async deleteOtp(id: number): Promise<void> {
    await db.delete(schema.otps).where(eq(schema.otps.id, id));
  }

  // Pockets
  async getUserPockets(userId: string): Promise<schema.Pocket[]> {
    return await db.select().from(schema.pockets).where(eq(schema.pockets.userId, userId));
  }

  async createPocket(pocket: schema.InsertPocket): Promise<schema.Pocket> {
    const result = await db.insert(schema.pockets).values(pocket).returning();
    return result[0];
  }

  async updatePocket(id: number, data: Partial<schema.InsertPocket>): Promise<schema.Pocket> {
    const result = await db.update(schema.pockets).set(data).where(eq(schema.pockets.id, id)).returning();
    return result[0];
  }

  // Transactions
  async getUserTransactions(userId: string, limit: number = 50): Promise<schema.Transaction[]> {
    return await db.select().from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date))
      .limit(limit);
  }

  async createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction> {
    const result = await db.insert(schema.transactions).values(transaction).returning();
    return result[0];
  }

  // Lena Dena
  async getUserLenaDena(userId: string): Promise<schema.LenaDena[]> {
    return await db.select().from(schema.lenaDena)
      .where(eq(schema.lenaDena.userId, userId))
      .orderBy(desc(schema.lenaDena.date));
  }

  async createLenaDena(entry: schema.InsertLenaDena): Promise<schema.LenaDena> {
    const result = await db.insert(schema.lenaDena).values(entry).returning();
    return result[0];
  }

  async updateLenaDena(id: number, data: Partial<schema.InsertLenaDena>): Promise<schema.LenaDena> {
    const result = await db.update(schema.lenaDena).set(data).where(eq(schema.lenaDena.id, id)).returning();
    return result[0];
  }

  // Budgets
  async getUserBudgets(userId: string, month: string): Promise<schema.Budget[]> {
    return await db.select().from(schema.budgets)
      .where(and(eq(schema.budgets.userId, userId), eq(schema.budgets.month, month)));
  }

  async createBudget(budget: schema.InsertBudget): Promise<schema.Budget> {
    const result = await db.insert(schema.budgets).values(budget).returning();
    return result[0];
  }

  async updateBudget(id: number, data: Partial<schema.InsertBudget>): Promise<schema.Budget> {
    const result = await db.update(schema.budgets).set(data).where(eq(schema.budgets.id, id)).returning();
    return result[0];
  }

  // Family
  async getUserFamilyMembers(userId: string): Promise<schema.FamilyMember[]> {
    return await db.select().from(schema.familyMembers)
      .where(eq(schema.familyMembers.userId, userId));
  }

  async createFamilyMember(member: schema.InsertFamilyMember): Promise<schema.FamilyMember> {
    const result = await db.insert(schema.familyMembers).values(member).returning();
    return result[0];
  }

  // Goals
  async getUserGoals(userId: string): Promise<schema.Goal[]> {
    return await db.select().from(schema.goals)
      .where(eq(schema.goals.userId, userId));
  }

  async createGoal(goal: schema.InsertGoal): Promise<schema.Goal> {
    const result = await db.insert(schema.goals).values(goal).returning();
    return result[0];
  }

  async updateGoal(id: number, data: Partial<schema.InsertGoal>): Promise<schema.Goal> {
    const result = await db.update(schema.goals).set(data).where(eq(schema.goals.id, id)).returning();
    return result[0];
  }

  // Auth helpers
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  // Tax Data
  async getTaxData(userId: string, year: string): Promise<schema.TaxData | undefined> {
    const result = await db.select().from(schema.taxData)
      .where(and(eq(schema.taxData.userId, userId), eq(schema.taxData.assessmentYear, year)))
      .limit(1);
    return result[0];
  }

  async createTaxData(data: schema.InsertTaxData): Promise<schema.TaxData> {
    const result = await db.insert(schema.taxData).values(data).returning();
    return result[0];
  }

  async updateTaxData(id: number, data: Partial<schema.InsertTaxData>): Promise<schema.TaxData> {
    const result = await db.update(schema.taxData).set(data).where(eq(schema.taxData.id, id)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
