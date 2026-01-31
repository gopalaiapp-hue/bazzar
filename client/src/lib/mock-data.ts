import { Wallet, Building2, Smartphone, Briefcase, PiggyBank, Home } from "lucide-react";

export const MOCK_POCKETS = [
  { id: "1", name: "Cash in Hand", type: "cash", amount: 4500, color: "bg-green-500" },
  { id: "2", name: "HDFC Bank", type: "bank", amount: 42300, color: "bg-blue-600" },
  { id: "3", name: "PhonePe Wallet", type: "upi", amount: 1250, color: "bg-purple-500" },
  { id: "4", name: "Salary Account", type: "salary", amount: 15000, color: "bg-indigo-500" },
  { id: "5", name: "Home Fund", type: "savings", amount: 250000, color: "bg-orange-500" },
] as const;

export const MOCK_TRANSACTIONS = [
  { id: "t1", merchant: "Zomato", amount: 450, category: "Food", date: "Today, 8:30 PM", icon: "🍔", type: "debit" },
  { id: "t2", merchant: "Uber Ride", amount: 230, category: "Transport", date: "Today, 6:15 PM", icon: "🚖", type: "debit" },
  { id: "t3", merchant: "Grocery Store", amount: 1200, category: "Groceries", date: "Yesterday", icon: "🥦", type: "debit" },
  { id: "t4", merchant: "Salary Credit", amount: 85000, category: "Salary", date: "1st Nov", icon: "💰", type: "credit" },
  { id: "t5", merchant: "Petrol Pump", amount: 500, category: "Fuel", date: "30th Oct", icon: "⛽", type: "debit" },
  { id: "t6", merchant: "Netflix", amount: 649, category: "Subscription", date: "28th Oct", icon: "🎬", type: "debit" },
];

export const TAX_DATA = {
  regime: "new",
  totalIncome: 1250000,
  deductions: 150000,
  taxableIncome: 1100000,
  taxPayable: 82500,
  refundDue: 0
};
