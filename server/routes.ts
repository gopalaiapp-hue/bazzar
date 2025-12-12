import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPocketSchema, insertTransactionSchema, insertLenaDenaSchema, insertBudgetSchema, insertFamilyMemberSchema, insertGoalSchema, insertTaxDataSchema, insertInviteCodeSchema } from "@shared/schema";
import { z } from "zod";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ========== MIDDLEWARE ==========

  // Update lastActiveAt
  app.use("/api", async (req, res, next) => {
    const userId = req.body.userId || req.query.userId || ((req as any).user)?.id;
    if (userId) {
      storage.updateUser(userId, { lastActiveAt: new Date() }).catch(console.error);
    }
    next();
  });

  // ========== INVITE CODE ROUTES ==========

  // Generate Invite Code (Admin) - One per HoF, never expires
  app.post("/api/auth/invite/generate", async (req, res) => {
    try {
      const { userId, familyName } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Check for existing active invite
      const existingInvite = await storage.getInviteCodeByCreator(userId);
      if (existingInvite && existingInvite.status === 'active') {
        return res.json({ invite: existingInvite });
      }

      // Generate new code in format FAM-XXXX-XX
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 4).toUpperCase();
      const code = `FAM-${part1}-${part2}`;

      const invite = await storage.createInviteCode({
        code,
        creatorId: userId,
        familyName: familyName || undefined,
        autoAccept: false,
        status: "active"
      });

      return res.json({ invite });
    } catch (error) {
      console.error("Generate invite error:", error);
      return res.status(500).json({ error: "Failed to generate code" });
    }
  });

  // Regenerate Invite Code (revokes old one)
  app.post("/api/auth/invite/regenerate", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Revoke existing
      await storage.revokeInviteCode(userId);

      // Generate new
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 4).toUpperCase();
      const code = `FAM-${part1}-${part2}`;

      const invite = await storage.createInviteCode({
        code,
        creatorId: userId,
        status: "active"
      });

      return res.json({ invite });
    } catch (error) {
      return res.status(500).json({ error: "Failed to regenerate code" });
    }
  });

  // Validate Invite Code
  app.post("/api/auth/invite/validate", async (req, res) => {
    try {
      const { code } = req.body;
      console.log("[Validate Invite] Checking code:", code);
      if (!code) return res.status(400).json({ error: "Code required" });

      const invite = await storage.getInviteCode(code);
      console.log("[Validate Invite] Found invite:", invite);

      if (!invite) {
        return res.status(404).json({ error: "Invalid code" });
      }

      if (invite.status !== "active") {
        return res.status(400).json({ error: "Code is no longer active" });
      }

      // Get admin details to show who invited
      const admin = await storage.getUser(invite.creatorId);

      return res.json({
        valid: true,
        adminName: admin?.name || "Family Admin",
        familyName: invite.familyName || `${admin?.name}'s Family`,
        autoAccept: invite.autoAccept,
        hofId: invite.creatorId
      });
    } catch (error) {
      console.error("[Validate Invite] Error:", error);
      return res.status(500).json({ error: "Validation failed" });
    }
  });

  // Submit Join Request
  app.post("/api/join/request", async (req, res) => {
    try {
      const { code, userId, userName, userPhone, userEmail, message } = req.body;

      if (!code || !userId || !userName) {
        return res.status(400).json({ error: "Code, userId, and userName required" });
      }

      // Validate code
      const invite = await storage.getInviteCode(code);
      if (!invite || invite.status !== "active") {
        return res.status(400).json({ error: "Invalid or revoked invite code" });
      }

      // Check if already requested
      const existing = await storage.getJoinRequestByRequester(userId);
      if (existing && existing.status === "pending") {
        return res.json({ status: "already_requested", request: existing });
      }

      // If auto-accept is ON, auto-approve
      if (invite.autoAccept) {
        // Link user directly
        await storage.updateUser(userId, {
          role: "member",
          linkedAdminId: invite.creatorId
        });
        return res.json({ status: "auto_approved", linkedTo: invite.creatorId });
      }

      // Create join request
      const request = await storage.createJoinRequest({
        inviteCode: code,
        requesterId: userId,
        requesterName: userName,
        requesterPhone: userPhone || null,
        requesterEmail: userEmail || null,
        message: message || null,
        status: "pending",
        hofId: invite.creatorId
      });

      return res.json({ status: "requested", request });
    } catch (error) {
      console.error("Join request error:", error);
      return res.status(500).json({ error: "Failed to submit join request" });
    }
  });

  // Get pending join requests (for HoF)
  app.get("/api/join/requests/:hofId", async (req, res) => {
    try {
      const requests = await storage.getPendingJoinRequests(req.params.hofId);
      return res.json({ requests });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  // Approve join request
  app.post("/api/join/approve/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { hofId, note } = req.body;

      // Get the request
      const requests = await storage.getJoinRequestsByHof(hofId);
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      // Update request status
      const updated = await storage.updateJoinRequest(requestId, {
        status: "approved",
        actionNote: note
      });

      // Link user to HoF
      await storage.updateUser(request.requesterId, {
        role: "member",
        linkedAdminId: hofId
      });

      return res.json({ success: true, request: updated });
    } catch (error) {
      console.error("Approve error:", error);
      return res.status(500).json({ error: "Failed to approve request" });
    }
  });

  // Reject join request
  app.post("/api/join/reject/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const { hofId, note } = req.body;

      const updated = await storage.updateJoinRequest(requestId, {
        status: "rejected",
        actionNote: note || "Request rejected"
      });

      return res.json({ success: true, request: updated });
    } catch (error) {
      return res.status(500).json({ error: "Failed to reject request" });
    }
  });

  // Check join status (for requester)
  app.get("/api/join/status/:userId", async (req, res) => {
    try {
      const request = await storage.getJoinRequestByRequester(req.params.userId);
      if (!request) {
        return res.json({ status: "none" });
      }
      return res.json({ status: request.status, request });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  // Member Signup (keeping for backward compatibility)
  app.post("/api/auth/member/signup", async (req, res) => {
    try {
      const { email, password, name, inviteCode } = req.body;

      if (!email || !password || !inviteCode) {
        return res.status(400).json({ error: "All fields required" });
      }

      // 1. Validate Code
      const invite = await storage.getInviteCode(inviteCode);
      if (!invite || invite.status !== "active") {
        return res.status(400).json({ error: "Invalid or revoked invite code" });
      }

      // 2. Check email
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // 3. Create Member with pending status
      const hashedPassword = await storage.hashPassword(password);
      const user = await storage.createUser({
        email,
        hashedPassword,
        name,
        role: invite.autoAccept ? "member" : "preview", // preview until approved
        linkedAdminId: invite.autoAccept ? invite.creatorId : null,
        onboardingComplete: false
      });

      // 4. If not auto-accept, create join request
      if (!invite.autoAccept) {
        await storage.createJoinRequest({
          inviteCode,
          requesterId: user.id,
          requesterName: name,
          requesterEmail: email,
          status: "pending",
          hofId: invite.creatorId
        });
      }

      return res.json({
        user,
        joinStatus: invite.autoAccept ? "approved" : "pending"
      });
    } catch (error) {
      console.error("Member signup error:", error);
      return res.status(500).json({ error: "Signup failed" });
    }
  });

  // Get Members (Admin)
  app.get("/api/members/:adminId", async (req, res) => {
    try {
      const members = await storage.getLinkedMembers(req.params.adminId);
      return res.json({ members });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch members" });
    }
  });

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

  // Email/Password Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await storage.hashPassword(password);
      const user = await storage.createUser({
        email,
        hashedPassword,
        name: name || null,
        onboardingStep: 1,
      });

      return res.json({ user });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ error: "Signup failed" });
    }
  });

  // Email/Password Signin
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.hashedPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await storage.verifyPassword(password, user.hashedPassword);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      return res.json({ user });
    } catch (error) {
      console.error("Signin error:", error);
      return res.status(500).json({ error: "Signin failed" });
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ success: true, message: "If this email exists, a reset link has been sent" });
      }

      // In a real implementation, you would:
      // 1. Generate a password reset token
      // 2. Store it in the database with expiration
      // 3. Send email with reset link
      // For now, we'll simulate success

      console.log(`🔑 Password reset requested for: ${email}`);

      return res.json({ success: true, message: "Password reset link sent to your email" });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Get User by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update User
  app.patch("/api/users/:id", async (req, res) => {
    try {
      console.log(`Updating user ${req.params.id} with data:`, req.body);
      const user = await storage.updateUser(req.params.id, req.body);
      console.log("User updated successfully:", user);
      return res.json({ user });
    } catch (error) {
      console.error("Failed to update user:", error);
      return res.status(500).json({ error: "Failed to update user" });
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

      const pocketTemplates: Omit<import("@shared/schema").InsertPocket, "userId">[] = [
        { name: "Salary", type: "salary", amount: 82000, color: "bg-emerald-500" },
        { name: "Daily Cash", type: "cash", amount: 5000, color: "bg-yellow-500" },
        { name: "Bank Account", type: "bank", amount: 125000, color: "bg-blue-600" },
        { name: "UPI Wallet", type: "upi", amount: 3500, color: "bg-purple-500" },
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

  // Transfer money between pockets
  app.post("/api/pockets/transfer", async (req, res) => {
    try {
      const { userId, fromPocketId, toPocketId, amount, note } = req.body;

      if (!userId || !fromPocketId || !toPocketId || !amount) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      if (fromPocketId === toPocketId) {
        return res.status(400).json({ error: "Cannot transfer to same pocket" });
      }

      const transfer = await storage.transferBetweenPockets(
        userId,
        parseInt(fromPocketId),
        parseInt(toPocketId),
        parseInt(amount),
        note
      );

      return res.json({ transfer });
    } catch (error: any) {
      console.error("Transfer error:", error);
      return res.status(500).json({ error: error.message || "Transfer failed" });
    }
  });

  // Add money to a specific pocket
  app.post("/api/pockets/:id/add", async (req, res) => {
    try {
      const { amount } = req.body;
      const pocketId = parseInt(req.params.id);

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount required" });
      }

      const pocket = await storage.addMoneyToPocket(pocketId, parseInt(amount));
      return res.json({ pocket });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to add money" });
    }
  });

  // Record spending from a pocket
  app.post("/api/pockets/:id/spend", async (req, res) => {
    try {
      const { amount } = req.body;
      const pocketId = parseInt(req.params.id);

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount required" });
      }

      const pocket = await storage.addSpentToPocket(pocketId, parseInt(amount));
      return res.json({ pocket });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to record spending" });
    }
  });

  // Get transfer history
  app.get("/api/pockets/transfers/:userId", async (req, res) => {
    try {
      const transfers = await storage.getPocketTransfers(req.params.userId);
      return res.json({ transfers });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch transfers" });
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
      console.error("Budget creation error:", error);
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

  // Get all family transactions (for family dashboard)
  app.get("/api/family/transactions/:adminId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const transactions = await storage.getFamilyTransactions(req.params.adminId, limit);
      return res.json({ transactions });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch family transactions" });
    }
  });

  // Update family member
  app.patch("/api/family/:id", async (req, res) => {
    try {
      const member = await storage.updateFamilyMember(parseInt(req.params.id), req.body);
      return res.json({ member });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update family member" });
    }
  });

  // Delete family member
  app.delete("/api/family/:id", async (req, res) => {
    try {
      await storage.deleteFamilyMember(parseInt(req.params.id));
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete family member" });
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

  // ========== TAX ROUTES ==========

  app.get("/api/tax/:userId", async (req, res) => {
    try {
      const year = (req.query.year as string) || "2025-26";
      let taxData = await storage.getTaxData(req.params.userId, year);

      if (!taxData) {
        // Create default if not exists
        taxData = await storage.createTaxData({
          userId: req.params.userId,
          assessmentYear: year
        });
      }

      return res.json({ taxData });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch tax data" });
    }
  });

  app.patch("/api/tax/:id", async (req, res) => {
    try {
      const taxData = await storage.updateTaxData(parseInt(req.params.id), req.body);
      return res.json({ taxData });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update tax data" });
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

  // Get single pocket
  app.get("/api/pockets/detail/:id", async (req, res) => {
    try {
      const pocketId = parseInt(req.params.id);
      const pocket = await storage.getPocket(pocketId);
      if (!pocket) return res.status(404).json({ error: "Pocket not found" });
      return res.json(pocket);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch pocket" });
    }
  });

  // ========== SUBSCRIPTIONS ROUTES ==========

  // Get user subscriptions
  app.get("/api/subscriptions/:userId", async (req, res) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.params.userId);
      return res.json({ subscriptions });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Create subscription
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const subscription = await storage.createSubscription(req.body);
      return res.json({ subscription });
    } catch (error) {
      console.error("Create subscription error:", error);
      return res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Update subscription
  app.patch("/api/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.updateSubscription(parseInt(req.params.id), req.body);
      return res.json({ subscription });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  // Delete subscription
  app.delete("/api/subscriptions/:id", async (req, res) => {
    try {
      await storage.deleteSubscription(parseInt(req.params.id));
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  return httpServer;
}
