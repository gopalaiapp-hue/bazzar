import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPocketSchema, insertTransactionSchema, insertLenaDenaSchema, insertBudgetSchema, insertFamilyMemberSchema, insertGoalSchema } from "@shared/schema";
import { z } from "zod";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ========== AUTH ROUTES ==========
  
  // Simple login (for demo/skip)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: "Phone required" });
      }

      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        user = await storage.createUser({ phone, onboardingStep: 1 });
      }

      return res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // Send OTP
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtp({ phone, code: otp, expiresAt });
      
      console.log(`🔐 OTP for ${phone}: ${otp}`); // Dev console
      
      return res.json({ success: true, message: "OTP sent" });
    } catch (error) {
      console.error("Send OTP error:", error);
      return res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, code } = req.body;
      
      if (!phone || !code) {
        return res.status(400).json({ error: "Phone and OTP required" });
      }

      const otpRecord = await storage.getOtp(phone);
      
      if (!otpRecord) {
        return res.status(400).json({ error: "OTP expired or not found" });
      }

      if (otpRecord.code !== code) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ error: "OTP expired" });
      }

      // Delete used OTP
      await storage.deleteOtp(otpRecord.id);

      // Get or create user
      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        user = await storage.createUser({ phone, onboardingStep: 1 });
      }

      return res.json({ user });
    } catch (error) {
      console.error("Verify OTP error:", error);
      return res.status(500).json({ error: "Verification failed" });
    }
  });

  // Onboarding Step 1: Save name
  app.patch("/api/onboarding/step1", async (req, res) => {
    try {
      const { userId, name } = req.body;
      
      if (!userId || !name) {
        return res.status(400).json({ error: "User ID and name required" });
      }

      const user = await storage.updateUser(userId, { name, onboardingStep: 2 });
      return res.json({ user });
    } catch (error) {
      console.error("Onboarding step 1 error:", error);
      return res.status(500).json({ error: "Failed to save name" });
    }
  });

  // Onboarding Step 2: Save family type
  app.patch("/api/onboarding/step2", async (req, res) => {
    try {
      const { userId, familyType } = req.body;
      
      if (!userId || !familyType) {
        return res.status(400).json({ error: "User ID and family type required" });
      }

      const isMarried = familyType === "couple" || familyType === "joint";
      const hasParents = familyType === "joint";

      const user = await storage.updateUser(userId, { 
        familyType, 
        isMarried,
        hasParents,
        onboardingStep: 3 
      });

      return res.json({ user });
    } catch (error) {
      console.error("Onboarding step 2 error:", error);
      return res.status(500).json({ error: "Failed to save family type" });
    }
  });

  // Onboarding Step 3: Save income sources
  app.patch("/api/onboarding/step3", async (req, res) => {
    try {
      const { userId, incomeSources } = req.body;
      
      if (!userId || !Array.isArray(incomeSources)) {
        return res.status(400).json({ error: "User ID and income sources array required" });
      }

      const hasSideIncome = incomeSources.length > 1 || incomeSources.includes("freelance") || incomeSources.includes("business");

      const user = await storage.updateUser(userId, { 
        incomeSources, 
        hasSideIncome,
        onboardingStep: 4 
      });

      return res.json({ user });
    } catch (error) {
      console.error("Onboarding step 3 error:", error);
      return res.status(500).json({ error: "Failed to save income sources" });
    }
  });

  // Onboarding Step 4: Link bank (mock) & create auto pockets
  app.post("/api/onboarding/link-bank", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Create default pockets based on income sources
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const pocketTemplates = [
        { name: "Salary", type: "salary" as const, amount: 82000, color: "bg-emerald-500" },
        { name: "Daily Cash", type: "cash" as const, amount: 5000, color: "bg-yellow-500" },
        { name: "Bank Account", type: "bank" as const, amount: 125000, color: "bg-blue-600" },
        { name: "UPI Wallet", type: "upi" as const, amount: 3500, color: "bg-purple-500" },
      ];

      if (user.isMarried || user.hasParents) {
        pocketTemplates.push({ name: "Home Fund", type: "savings" as const, amount: 250000, color: "bg-orange-500" });
      }

      for (const template of pocketTemplates) {
        await storage.createPocket({ ...template, userId });
      }

      // Complete onboarding
      const updatedUser = await storage.updateUser(userId, { 
        onboardingStep: 99,
        onboardingComplete: true 
      });

      return res.json({ user: updatedUser });
    } catch (error) {
      console.error("Link bank error:", error);
      return res.status(500).json({ error: "Failed to link bank" });
    }
  });

  // Get user profile
  app.get("/api/auth/me/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json({ user });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ========== POCKETS ROUTES ==========
  
  app.get("/api/pockets/:userId", async (req, res) => {
    try {
      const pockets = await storage.getUserPockets(req.params.userId);
      return res.json({ pockets });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch pockets" });
    }
  });

  app.post("/api/pockets", async (req, res) => {
    try {
      const validated = insertPocketSchema.parse(req.body);
      const pocket = await storage.createPocket(validated);
      return res.json({ pocket });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "Failed to create pocket" });
    }
  });

  app.patch("/api/pockets/:id", async (req, res) => {
    try {
      const pocket = await storage.updatePocket(parseInt(req.params.id), req.body);
      return res.json({ pocket });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update pocket" });
    }
  });

  // ========== TRANSACTIONS ROUTES ==========
  
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const transactions = await storage.getUserTransactions(req.params.userId, limit);
      return res.json({ transactions });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validated = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validated);
      return res.json({ transaction });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // ========== LENA-DENA ROUTES ==========
  
  app.get("/api/lenadena/:userId", async (req, res) => {
    try {
      const entries = await storage.getUserLenaDena(req.params.userId);
      return res.json({ entries });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch lena-dena" });
    }
  });

  app.post("/api/lenadena", async (req, res) => {
    try {
      const validated = insertLenaDenaSchema.parse(req.body);
      const entry = await storage.createLenaDena(validated);
      return res.json({ entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "Failed to create entry" });
    }
  });

  app.patch("/api/lenadena/:id", async (req, res) => {
    try {
      const entry = await storage.updateLenaDena(parseInt(req.params.id), req.body);
      return res.json({ entry });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update entry" });
    }
  });

  // ========== BUDGETS ROUTES ==========
  
  app.get("/api/budgets/:userId", async (req, res) => {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const budgets = await storage.getUserBudgets(req.params.userId, month);
      return res.json({ budgets });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const validated = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(validated);
      return res.json({ budget });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "Failed to create budget" });
    }
  });

  app.patch("/api/budgets/:id", async (req, res) => {
    try {
      const budget = await storage.updateBudget(parseInt(req.params.id), req.body);
      return res.json({ budget });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update budget" });
    }
  });

  // ========== FAMILY ROUTES ==========
  
  app.get("/api/family/:userId", async (req, res) => {
    try {
      const members = await storage.getUserFamilyMembers(req.params.userId);
      return res.json({ members });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch family members" });
    }
  });

  app.post("/api/family", async (req, res) => {
    try {
      const validated = insertFamilyMemberSchema.parse(req.body);
      const member = await storage.createFamilyMember(validated);
      return res.json({ member });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "Failed to create family member" });
    }
  });

  // ========== GOALS ROUTES ==========
  
  app.get("/api/goals/:userId", async (req, res) => {
    try {
      const goals = await storage.getUserGoals(req.params.userId);
      return res.json({ goals });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const validated = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(validated);
      return res.json({ goal });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.updateGoal(parseInt(req.params.id), req.body);
      return res.json({ goal });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update goal" });
    }
  });

  // ========== SEED DATA ROUTE (for dev) ==========
  
  app.post("/api/seed/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;

      // Create default pockets
      const pockets = [
        { userId, type: "cash" as const, name: "Cash in Hand", amount: 4500, color: "bg-green-500" },
        { userId, type: "bank" as const, name: "HDFC Bank", amount: 42300, color: "bg-blue-600" },
        { userId, type: "upi" as const, name: "PhonePe Wallet", amount: 1250, color: "bg-purple-500" },
        { userId, type: "salary" as const, name: "Salary Account", amount: 15000, color: "bg-indigo-500" },
        { userId, type: "savings" as const, name: "Home Fund", amount: 250000, color: "bg-orange-500" },
      ];

      for (const pocket of pockets) {
        await storage.createPocket(pocket);
      }

      // Create sample transactions
      const transactions = [
        { userId, type: "debit" as const, amount: 450, merchant: "Zomato", category: "Food", icon: "🍔" },
        { userId, type: "debit" as const, amount: 230, merchant: "Uber Ride", category: "Transport", icon: "🚖" },
        { userId, type: "debit" as const, amount: 1200, merchant: "Grocery Store", category: "Groceries", icon: "🥦" },
        { userId, type: "credit" as const, amount: 85000, merchant: "Salary Credit", category: "Salary", icon: "💰" },
      ];

      for (const tx of transactions) {
        await storage.createTransaction(tx);
      }

      // Create budgets
      const month = new Date().toISOString().slice(0, 7);
      const budgets = [
        { userId, category: "Groceries", limit: 8000, spent: 6560, month, color: "text-green-600" },
        { userId, category: "Eating Out", limit: 4000, spent: 3800, month, color: "text-orange-600" },
        { userId, category: "Shopping", limit: 6000, spent: 6200, month, color: "text-purple-600" },
        { userId, category: "EMI & Bills", limit: 15000, spent: 15000, month, color: "text-blue-600" },
      ];

      for (const budget of budgets) {
        await storage.createBudget(budget);
      }

      return res.json({ success: true, message: "Seed data created" });
    } catch (error) {
      console.error("Seed error:", error);
      return res.status(500).json({ error: "Seed failed" });
    }
  });

  return httpServer;
}
