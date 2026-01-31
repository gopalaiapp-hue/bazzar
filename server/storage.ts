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
  syncUser(user: any): Promise<schema.User>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  getLinkedMembers(adminId: string): Promise<schema.User[]>;
  deleteUser(id: string): Promise<void>;

  // Invite Codes
  createInviteCode(code: schema.InsertInviteCode): Promise<schema.InviteCode>;
  getInviteCode(code: string): Promise<schema.InviteCode | undefined>;
  getInviteCodeByCreator(creatorId: string): Promise<schema.InviteCode | undefined>;
  revokeInviteCode(creatorId: string): Promise<void>;

  // Join Requests
  createJoinRequest(request: schema.InsertJoinRequest): Promise<schema.JoinRequest>;
  getJoinRequestsByHof(hofId: string): Promise<schema.JoinRequest[]>;
  getPendingJoinRequests(hofId: string): Promise<schema.JoinRequest[]>;
  getJoinRequestByRequester(requesterId: string): Promise<schema.JoinRequest | undefined>;
  updateJoinRequest(id: number, data: { status: string; actionNote?: string }): Promise<schema.JoinRequest>;

  // OTP
  createOtp(otp: schema.InsertOtp): Promise<schema.Otp>;
  getOtp(phone: string): Promise<schema.Otp | undefined>;
  deleteOtp(id: number): Promise<void>;

  // Pockets
  getUserPockets(userId: string): Promise<schema.Pocket[]>;
  getPocket(id: number): Promise<schema.Pocket | undefined>;
  createPocket(pocket: schema.InsertPocket): Promise<schema.Pocket>;
  updatePocket(id: number, data: Partial<schema.InsertPocket>): Promise<schema.Pocket>;

  // Transactions
  getUserTransactions(userId: string, limit?: number): Promise<schema.Transaction[]>;
  createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction>;
  updateTransaction(id: number, transaction: Partial<schema.InsertTransaction>): Promise<schema.Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Lena Dena
  getUserLenaDena(userId: string): Promise<schema.LenaDena[]>;
  createLenaDena(entry: schema.InsertLenaDena): Promise<schema.LenaDena>;
  updateLenaDena(id: number, data: Partial<schema.InsertLenaDena>): Promise<schema.LenaDena>;
  deleteLenaDena(id: number): Promise<void>;

  // Budgets
  getUserBudgets(userId: string, month: string): Promise<schema.Budget[]>;
  createBudget(budget: schema.InsertBudget): Promise<schema.Budget>;
  updateBudget(id: number, data: Partial<schema.InsertBudget>): Promise<schema.Budget>;
  deleteBudget(id: number): Promise<void>;

  // Family
  getUserFamilyMembers(userId: string): Promise<schema.FamilyMember[]>;
  createFamilyMember(member: schema.InsertFamilyMember): Promise<schema.FamilyMember>;

  // Goals
  getUserGoals(userId: string): Promise<schema.Goal[]>;
  createGoal(goal: schema.InsertGoal): Promise<schema.Goal>;
  updateGoal(id: number, data: Partial<schema.InsertGoal>): Promise<schema.Goal>;
  deleteGoal(id: number): Promise<void>;

  // Tax Data
  getTaxData(userId: string, year: string): Promise<schema.TaxData | undefined>;
  createTaxData(data: schema.InsertTaxData): Promise<schema.TaxData>;
  updateTaxData(id: number, data: Partial<schema.InsertTaxData>): Promise<schema.TaxData>;

  // Subscriptions
  getUserSubscriptions(userId: string): Promise<schema.Subscription[]>;
  createSubscription(subscription: schema.InsertSubscription): Promise<schema.Subscription>;
  updateSubscription(id: number, data: Partial<schema.InsertSubscription>): Promise<schema.Subscription>;
  deleteSubscription(id: number): Promise<void>;
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

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
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

  async syncUser(user: any): Promise<schema.User> {
    // Explicit sync: Check existence, then update or insert
    const existing = await this.getUser(user.id);
    if (existing) {
      console.log(`syncUser: Updating existing user ${user.id}`);
      return await this.updateUser(user.id, user);
    } else {
      console.log(`syncUser: Inserting new user ${user.id}`);
      // Force insert with ID
      const result = await db.insert(schema.users).values(user).returning();
      if (!result[0]) throw new Error("Sync Insert returned no data");
      return result[0];
    }
  }

  async getLinkedMembers(adminId: string): Promise<schema.User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.linkedAdminId, adminId));
  }

  async deleteUser(id: string): Promise<void> {
    // 1. Transactions & Transfers
    await db.delete(schema.transactions).where(eq(schema.transactions.userId, id));
    await db.delete(schema.pocketTransfers).where(eq(schema.pocketTransfers.userId, id));

    // 2. Core Financial Data
    await db.delete(schema.pockets).where(eq(schema.pockets.userId, id));
    await db.delete(schema.budgets).where(eq(schema.budgets.userId, id));
    await db.delete(schema.goals).where(eq(schema.goals.userId, id));
    await db.delete(schema.lenaDena).where(eq(schema.lenaDena.userId, id));
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, id));
    await db.delete(schema.taxData).where(eq(schema.taxData.userId, id));

    // 3. Family & Auth
    await db.delete(schema.familyMembers).where(eq(schema.familyMembers.userId, id));
    await db.delete(schema.joinRequests).where(eq(schema.joinRequests.requesterId, id));
    await db.delete(schema.inviteCodes).where(eq(schema.inviteCodes.creatorId, id));
    await db.delete(schema.otps).where(eq(schema.otps.phone, (await this.getUser(id))?.phone || ''));

    // 4. Finally delete user
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  // Invite Codes
  async createInviteCode(code: schema.InsertInviteCode): Promise<schema.InviteCode> {
    const result = await db.insert(schema.inviteCodes).values(code).returning();
    return result[0];
  }

  async getInviteCode(code: string): Promise<schema.InviteCode | undefined> {
    const result = await db.select().from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, code))
      .limit(1);
    return result[0];
  }

  async getInviteCodeByCreator(creatorId: string): Promise<schema.InviteCode | undefined> {
    const result = await db.select().from(schema.inviteCodes)
      .where(and(
        eq(schema.inviteCodes.creatorId, creatorId),
        eq(schema.inviteCodes.status, "active")
      ))
      .orderBy(desc(schema.inviteCodes.createdAt))
      .limit(1);
    return result[0];
  }

  async getFamilyTransactions(adminId: string, limit: number = 100): Promise<schema.Transaction[]> {
    // Get all linked member IDs
    const members = await this.getLinkedMembers(adminId);
    const memberIds = [adminId, ...members.map(m => m.id)];

    // Get transactions for all family members
    const allTransactions: schema.Transaction[] = [];
    for (const userId of memberIds) {
      const txns = await db.select().from(schema.transactions)
        .where(eq(schema.transactions.userId, userId))
        .orderBy(desc(schema.transactions.date))
        .limit(limit);
      allTransactions.push(...txns);
    }

    // Sort by date and limit
    return allTransactions
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, limit);
  }

  async updateFamilyMember(id: number, data: Partial<schema.InsertFamilyMember>): Promise<schema.FamilyMember> {
    const result = await db.update(schema.familyMembers)
      .set(data)
      .where(eq(schema.familyMembers.id, id))
      .returning();
    return result[0];
  }

  async deleteFamilyMember(id: number): Promise<void> {
    await db.delete(schema.familyMembers).where(eq(schema.familyMembers.id, id));
  }

  // Join Requests
  async createJoinRequest(request: schema.InsertJoinRequest): Promise<schema.JoinRequest> {
    const result = await db.insert(schema.joinRequests).values(request).returning();
    return result[0];
  }

  async getJoinRequestsByHof(hofId: string): Promise<schema.JoinRequest[]> {
    return await db.select().from(schema.joinRequests)
      .where(eq(schema.joinRequests.hofId, hofId))
      .orderBy(desc(schema.joinRequests.createdAt));
  }

  async getPendingJoinRequests(hofId: string): Promise<schema.JoinRequest[]> {
    return await db.select().from(schema.joinRequests)
      .where(and(
        eq(schema.joinRequests.hofId, hofId),
        eq(schema.joinRequests.status, "pending")
      ))
      .orderBy(desc(schema.joinRequests.createdAt));
  }

  async getJoinRequestByRequester(requesterId: string): Promise<schema.JoinRequest | undefined> {
    const result = await db.select().from(schema.joinRequests)
      .where(eq(schema.joinRequests.requesterId, requesterId))
      .orderBy(desc(schema.joinRequests.createdAt))
      .limit(1);
    return result[0];
  }

  async updateJoinRequest(id: number, data: { status: string; actionNote?: string }): Promise<schema.JoinRequest> {
    const result = await db.update(schema.joinRequests)
      .set({ ...data, actionAt: new Date() })
      .where(eq(schema.joinRequests.id, id))
      .returning();
    return result[0];
  }

  async revokeInviteCode(creatorId: string): Promise<void> {
    await db.update(schema.inviteCodes)
      .set({ status: "revoked" })
      .where(eq(schema.inviteCodes.creatorId, creatorId));
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

  async getPocket(id: number): Promise<schema.Pocket | undefined> {
    const result = await db.select().from(schema.pockets).where(eq(schema.pockets.id, id)).limit(1);
    return result[0];
  }

  async addSpentToPocket(pocketId: number, amount: number): Promise<schema.Pocket> {
    const pocket = await this.getPocket(pocketId);
    if (!pocket) throw new Error("Pocket not found");

    const newSpent = (pocket.spent || 0) + amount;
    const newAmount = (pocket.amount || 0) - amount;

    const result = await db.update(schema.pockets)
      .set({ spent: newSpent, amount: newAmount })
      .where(eq(schema.pockets.id, pocketId))
      .returning();
    return result[0];
  }

  async addMoneyToPocket(pocketId: number, amount: number): Promise<schema.Pocket> {
    const pocket = await this.getPocket(pocketId);
    if (!pocket) throw new Error("Pocket not found");

    const newAmount = (pocket.amount || 0) + amount;

    const result = await db.update(schema.pockets)
      .set({ amount: newAmount })
      .where(eq(schema.pockets.id, pocketId))
      .returning();
    return result[0];
  }

  async transferBetweenPockets(
    userId: string,
    fromPocketId: number,
    toPocketId: number,
    amount: number,
    note?: string
  ): Promise<schema.PocketTransfer> {
    // Deduct from source pocket
    const fromPocket = await this.getPocket(fromPocketId);
    if (!fromPocket) throw new Error("Source pocket not found");
    if ((fromPocket.amount || 0) < amount) throw new Error("Insufficient balance");

    await db.update(schema.pockets)
      .set({ amount: (fromPocket.amount || 0) - amount })
      .where(eq(schema.pockets.id, fromPocketId));

    // Add to destination pocket
    const toPocket = await this.getPocket(toPocketId);
    if (!toPocket) throw new Error("Destination pocket not found");

    await db.update(schema.pockets)
      .set({ amount: (toPocket.amount || 0) + amount })
      .where(eq(schema.pockets.id, toPocketId));

    // Record transfer
    const transfer = await db.insert(schema.pocketTransfers).values({
      userId,
      fromPocketId,
      toPocketId,
      amount,
      note
    }).returning();

    return transfer[0];
  }

  async getPocketTransfers(userId: string): Promise<schema.PocketTransfer[]> {
    return await db.select().from(schema.pocketTransfers)
      .where(eq(schema.pocketTransfers.userId, userId))
      .orderBy(desc(schema.pocketTransfers.createdAt));
  }

  async findPocketByCategory(userId: string, category: string): Promise<schema.Pocket | undefined> {
    const pockets = await this.getUserPockets(userId);
    return pockets.find(p => p.linkedCategories?.includes(category));
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
    const newTx = result[0];

    // Sync with Budget if it's an expense
    if (newTx.type === 'debit') {
      await this.syncBudgetWithTransaction(newTx, 'add');
    }

    return newTx;
  }

  async updateTransaction(id: number, data: Partial<schema.InsertTransaction>): Promise<schema.Transaction> {
    // 1. Get original transaction to revert its effect
    const originalTx = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).limit(1).then(res => res[0]);
    if (!originalTx) throw new Error("Transaction not found");

    // 2. Revert original budget effect
    if (originalTx.type === 'debit') {
      await this.syncBudgetWithTransaction(originalTx, 'remove');
    }

    // 3. Update transaction
    const result = await db.update(schema.transactions).set(data).where(eq(schema.transactions.id, id)).returning();
    const updatedTx = result[0];

    // 4. Apply new budget effect
    if (updatedTx.type === 'debit') {
      await this.syncBudgetWithTransaction(updatedTx, 'add');
    }

    return updatedTx;
  }

  async deleteTransaction(id: number): Promise<void> {
    const tx = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).limit(1).then(res => res[0]);
    if (tx && tx.type === 'debit') {
      await this.syncBudgetWithTransaction(tx, 'remove');
    }
    await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
  }

  // Helper to sync budget
  private async syncBudgetWithTransaction(tx: schema.Transaction, operation: 'add' | 'remove') {
    if (!tx.category || !tx.amount) return;

    // Determine month string (YYYY-MM) from transaction date or now
    const date = tx.date ? new Date(tx.date) : new Date();
    const month = date.toISOString().slice(0, 7);

    // Find matching budget
    const budgets = await db.select().from(schema.budgets)
      .where(and(
        eq(schema.budgets.userId, tx.userId),
        eq(schema.budgets.category, tx.category),
        eq(schema.budgets.month, month)
      ))
      .limit(1);

    if (budgets.length > 0) {
      const budget = budgets[0];
      let newSpent = budget.spent || 0;

      if (operation === 'add') newSpent += tx.amount;
      else newSpent -= tx.amount;

      // Prevent negative spent (optional, but good for safety)
      if (newSpent < 0) newSpent = 0;

      await db.update(schema.budgets)
        .set({ spent: newSpent })
        .where(eq(schema.budgets.id, budget.id));

      console.log(`Budget synced: ${operation} ₹${tx.amount} to/from ${budget.category} (${month})`);
    }
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

  async deleteLenaDena(id: number): Promise<void> {
    await db.delete(schema.lenaDena).where(eq(schema.lenaDena.id, id));
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

  async deleteBudget(id: number): Promise<void> {
    await db.delete(schema.budgets).where(eq(schema.budgets.id, id));
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

  async deleteGoal(id: number): Promise<void> {
    await db.delete(schema.goals).where(eq(schema.goals.id, id));
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

  // Subscriptions
  async getUserSubscriptions(userId: string): Promise<schema.Subscription[]> {
    return await db.select().from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .orderBy(desc(schema.subscriptions.createdAt));
  }

  async createSubscription(subscription: schema.InsertSubscription): Promise<schema.Subscription> {
    const result = await db.insert(schema.subscriptions).values(subscription).returning();
    return result[0];
  }

  async updateSubscription(id: number, data: Partial<schema.InsertSubscription>): Promise<schema.Subscription> {
    const result = await db.update(schema.subscriptions).set(data).where(eq(schema.subscriptions.id, id)).returning();
    return result[0];
  }

  async deleteSubscription(id: number): Promise<void> {
    await db.delete(schema.subscriptions).where(eq(schema.subscriptions.id, id));
  }
}

export const storage = new DatabaseStorage();
