import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const accountTypeEnum = pgEnum('account_type', ['cash', 'bank', 'upi', 'wallet']);
export const pocketTypeEnum = pgEnum('pocket_type', ['cash', 'bank', 'upi', 'salary', 'savings', 'family', 'custom']);
export const transactionTypeEnum = pgEnum('transaction_type', ['debit', 'credit']);
export const lenaDenaTypeEnum = pgEnum('lena_dena_type', ['gave', 'took']);
export const statusEnum = pgEnum('status', ['pending', 'settled']);

// Users Table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").unique(),
  email: text("email").unique(),
  hashedPassword: text("hashed_password"),
  name: text("name"),
  language: text("language").default("English"),
  familyType: text("family_type"), // 'single', 'couple', 'joint'
  incomeSources: text("income_sources").array().default(sql`ARRAY[]::text[]`), // ['salary', 'freelance', etc]
  isMarried: boolean("is_married").default(false),
  hasParents: boolean("has_parents").default(false),
  hasSideIncome: boolean("has_side_income").default(false),
  onboardingStep: integer("onboarding_step").default(0), // 0=start, 1=name, 2=family, 3=income, 4=bank, 99=complete
  onboardingComplete: boolean("onboarding_complete").default(false),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// OTP Table
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpSchema = createInsertSchema(otps).omit({ id: true, createdAt: true });
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Otp = typeof otps.$inferSelect;

// Accounts Table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: accountTypeEnum("type").notNull(),
  name: text("name").notNull(),
  balance: integer("balance").default(0),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Pockets Table
export const pockets = pgTable("pockets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: pocketTypeEnum("type").notNull(),
  name: text("name").notNull(),
  amount: integer("amount").default(0),
  color: text("color").default("bg-blue-500"),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPocketSchema = createInsertSchema(pockets).omit({ id: true, createdAt: true });
export type InsertPocket = z.infer<typeof insertPocketSchema>;
export type Pocket = typeof pockets.$inferSelect;

// Transactions Table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  accountId: integer("account_id").references(() => accounts.id),
  pocketId: integer("pocket_id").references(() => pockets.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  icon: text("icon").default("💳"),
  date: timestamp("date").defaultNow(),
  description: text("description"),
  paymentMethod: text("payment_method"),
  paidBy: text("paid_by"),
  isBorrowed: boolean("is_borrowed").default(false),
  lenderName: text("lender_name"),
  lenderPhone: text("lender_phone"),
  isShared: boolean("is_shared").default(false),
  notes: text("notes"),
  hasSplit: boolean("has_split").default(false),
  splitAmount1: integer("split_amount_1"),
  splitAmount2: integer("split_amount_2"),
  splitMethod1: text("split_method_1"),
  splitMethod2: text("split_method_2"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, date: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Lena Dena Table
export const lenaDena = pgTable("lena_dena", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: lenaDenaTypeEnum("type").notNull(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  status: statusEnum("status").default("pending"),
  notes: text("notes"),
});

export const insertLenaDenaSchema = createInsertSchema(lenaDena).omit({ id: true, date: true });
export type InsertLenaDena = z.infer<typeof insertLenaDenaSchema>;
export type LenaDena = typeof lenaDena.$inferSelect;

// Budgets Table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  limit: integer("limit").notNull(),
  spent: integer("spent").default(0),
  month: text("month").notNull(),
  icon: text("icon"),
  color: text("color"),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true });
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// Family Members Table
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  relationship: text("relationship"),
  phone: text("phone"),
  income: integer("income").default(0),
  isNominee: boolean("is_nominee").default(false),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({ id: true });
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;

// Goals Table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").default(0),
  deadline: timestamp("deadline"),
  icon: text("icon"),
  isPriority: boolean("is_priority").default(false),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Tax Data Table
export const taxData = pgTable("tax_data", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  assessmentYear: text("assessment_year").notNull(), // e.g., "2025-26"
  incomeSalary: integer("income_salary").default(0),
  incomeInterest: integer("income_interest").default(0),
  incomeCapitalGains: integer("income_capital_gains").default(0),
  deductions80C: integer("deductions_80c").default(0),
  deductions80D: integer("deductions_80d").default(0),
  hra: integer("hra").default(0),
  regime: text("regime").default("new"), // 'old' or 'new'
  taxPayableOld: integer("tax_payable_old").default(0),
  taxPayableNew: integer("tax_payable_new").default(0),
  isFiled: boolean("is_filed").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaxDataSchema = createInsertSchema(taxData).omit({ id: true, updatedAt: true });
export type InsertTaxData = z.infer<typeof insertTaxDataSchema>;
export type TaxData = typeof taxData.$inferSelect;
