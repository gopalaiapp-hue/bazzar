import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MobileShell } from "@/components/layout/mobile-shell";
import { PocketCard } from "@/components/ui/pocket-card";
import { Bell, Search, Filter, Plus, ArrowUpRight, ArrowDownLeft, Edit2, Trash2, Check, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Pocket, Transaction as DbTransaction } from "@shared/schema";
import { useLocation, useRoute } from "wouter";
import { useUser } from "@/context/UserContext";
import { notifyTransaction } from "@/lib/notificationService";
import { apiUrl } from "@/lib/api-config";

// Force refetch on focus
function useFocusEffect(callback: () => void) {
  const [location] = useLocation();
  useEffect(() => {
    callback();
  }, [location, callback]);
}

interface Transaction {
  id: string;
  type: "debit" | "credit";
  amount: number;
  merchant: string;
  category: string;
  icon: string;
  date: string;
  paymentMethod: string;
  paidBy: string;
  notes: string;
  isBorrowed: boolean;
  lenderName?: string;
  lenderPhone?: string;
  isShared: boolean;
  createdAt: number;
  editDeadline: number;
  receiptUrl?: string;
  hasSplit?: boolean;
  splitAmount1?: number;
  splitAmount2?: number;
  splitMethod1?: string;
  splitMethod2?: string;
}

const CATEGORIES = [
  { label: "Groceries", icon: "🛒", color: "bg-green-100" },
  { label: "Utilities", icon: "⚡", color: "bg-yellow-100" },
  { label: "Transport", icon: "🚗", color: "bg-blue-100" },
  { label: "Healthcare", icon: "❤️", color: "bg-red-100" },
  { label: "Education", icon: "📚", color: "bg-purple-100" },
  { label: "Entertainment", icon: "🎬", color: "bg-pink-100" },
  { label: "Shopping", icon: "🛍️", color: "bg-orange-100" },
  { label: "Rent", icon: "🏠", color: "bg-indigo-100" },
  { label: "Food & Dining", icon: "🍽️", color: "bg-amber-100" },
  { label: "Bills", icon: "📄", color: "bg-slate-100" },
  { label: "Fuel", icon: "⛽", color: "bg-cyan-100" },
  { label: "Salary", icon: "💼", color: "bg-emerald-100" },
];

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Wallet"];

export default function Home() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user, isLoading } = useUser();
  const userId = user?.id;

  // AUTH GUARD: Redirect to onboarding if not logged in
  React.useEffect(() => {
    if (!isLoading && !user) {
      console.log("Home: No user found, redirecting to onboarding");
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  // Refetch data when screen comes into focus
  useFocusEffect(React.useCallback(() => {
    if (userId) {
      console.log("Home focused, refreshing data...");
      queryClient.invalidateQueries({ queryKey: ["pockets", userId] });
      queryClient.invalidateQueries({ queryKey: ["goals", userId] }); // Ensure goals are refreshed
    }
  }, [userId, queryClient]));

  const { data: pockets = [], isLoading: pocketsLoading, isError: pocketsError, error: pocketsErrorDetails } = useQuery<Pocket[]>({
    queryKey: ["pockets", userId],
    queryFn: async () => {
      if (!userId) {
        console.warn("Pockets query: No userId available");
        return [];
      }

      console.log("Fetching pockets for user:", userId);
      try {
        // Use Supabase directly for more reliable data fetching
        const { supabase } = await import("@/lib/supabaseClient");

        const { data, error } = await supabase
          .from('pockets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Supabase pocket fetch error:", error);
          throw new Error(error.message);
        }

        // Transform snake_case to camelCase
        const transformedPockets = (data || []).map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          type: p.type,
          amount: p.amount,
          spent: p.spent,
          targetAmount: p.target_amount,
          deadline: p.deadline,
          monthlyContribution: p.monthly_contribution,
          linkedCategories: p.linked_categories,
          icon: p.icon,
          color: p.color,
          createdAt: p.created_at,
        }));

        console.log("Pockets fetched successfully from Supabase:", transformedPockets.length, "pockets");
        return transformedPockets;
      } catch (err) {
        console.error("Error fetching pockets from Supabase:", err);

        // Fallback to backend API if Supabase fails
        try {
          console.log("Falling back to backend API...");
          const res = await fetch(apiUrl(`/api/pockets/${userId}`));

          if (!res.ok) {
            const errorText = await res.text();
            console.error(`Backend API error: ${res.status} - ${errorText}`);
            throw new Error(`Failed to fetch pockets: ${res.status}`);
          }

          const data = await res.json();
          console.log("Pockets fetched from backend:", data.pockets?.length || 0);
          return data.pockets || [];
        } catch (backendErr) {
          console.error("Backend API also failed:", backendErr);
          throw err; // Throw original Supabase error
        }
      }
    },
    enabled: !!userId,
    retry: 2
  });

  useEffect(() => {
    if (pocketsError) {
      console.error("Pockets query error:", pocketsErrorDetails);
      toast({
        title: "Error Loading Pockets",
        description: "Unable to load your pockets. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  }, [pocketsError, pocketsErrorDetails, toast]);


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "debit" | "credit">("all");

  // Add Pocket State
  const [addPocketOpen, setAddPocketOpen] = useState(false);
  const [newPocketName, setNewPocketName] = useState("");
  const [newPocketAmount, setNewPocketAmount] = useState("");
  const [newPocketType, setNewPocketType] = useState("cash");
  const [newPocketTarget, setNewPocketTarget] = useState("");
  const [newPocketDeadline, setNewPocketDeadline] = useState("");
  const [newPocketIcon, setNewPocketIcon] = useState("💰");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferFrom, setTransferFrom] = useState<number | null>(null);
  const [transferTo, setTransferTo] = useState<number | null>(null);
  const [transferAmount, setTransferAmount] = useState("");


  const [formData, setFormData] = useState({
    type: "debit",
    amount: "",
    merchant: "",
    category: "Groceries",
    paymentMethod: "Cash",
    paidBy: "You",
    notes: "",
    isBorrowed: false,
    lenderName: "",
    lenderPhone: "",
    isShared: false,
    receiptUrl: "",
    hasSplit: false,
    splitAmount1: "",
    splitAmount2: "",
    splitMethod1: "Cash",
    splitMethod2: "UPI",
  });



  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bazaar_transactions");
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // Calculate balance from pockets
  const totalBalance = pockets.reduce((acc, pocket) => acc + (pocket.amount || 0), 0);

  // Calculate income and expense from transactions
  const totalIncome = transactions
    .filter(tx => tx.type === "credit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => tx.type === "debit")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Net balance = income - expense
  const netBalance = totalIncome - totalExpense;

  // Calculate today's spending
  const getTodaySpending = () => {
    const today = new Date().toLocaleDateString("en-IN");
    return transactions
      .filter(tx => tx.date === today && tx.type === "debit")
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const canEditTransaction = (tx: Transaction) => {
    return Date.now() - tx.createdAt < 3600000; // 1 hour
  };

  const handleSaveTransaction = () => {
    if (!formData.amount || !formData.merchant) {
      toast({ title: "Required fields missing", description: "Enter amount and merchant name", variant: "destructive" });
      return;
    }

    // Validate split amounts
    if (formData.hasSplit) {
      const split1 = parseInt(formData.splitAmount1 as any) || 0;
      const split2 = parseInt(formData.splitAmount2 as any) || 0;
      const total = parseInt(formData.amount);

      if (split1 + split2 !== total) {
        toast({
          title: "Split validation failed",
          description: `Split amounts (₹${split1} + ₹${split2}) must equal total (₹${total})`,
          variant: "destructive"
        });
        return;
      }
    }

    const newTx: Transaction = {
      id: editingId || `t${Date.now()}`,
      type: formData.type as "debit" | "credit",
      amount: parseInt(formData.amount),
      merchant: formData.merchant,
      category: formData.category,
      icon: CATEGORIES.find(c => c.label === formData.category)?.icon || (customCategories.includes(formData.category) ? "🏷️" : "💳"),
      date: new Date().toLocaleDateString("en-IN"),
      paymentMethod: formData.paymentMethod,
      paidBy: formData.paidBy,
      notes: formData.notes,
      isBorrowed: formData.isBorrowed,
      lenderName: formData.lenderName,
      lenderPhone: formData.lenderPhone,
      isShared: formData.isShared,
      receiptUrl: formData.receiptUrl,
      hasSplit: formData.hasSplit,
      splitAmount1: formData.hasSplit ? parseInt(formData.splitAmount1 as any) : undefined,
      splitAmount2: formData.hasSplit ? parseInt(formData.splitAmount2 as any) : undefined,
      splitMethod1: formData.hasSplit ? formData.splitMethod1 : undefined,
      splitMethod2: formData.hasSplit ? formData.splitMethod2 : undefined,
      createdAt: editingId ? transactions.find(t => t.id === editingId)?.createdAt || Date.now() : Date.now(),
      editDeadline: editingId ? transactions.find(t => t.id === editingId)?.editDeadline || Date.now() + 3600000 : Date.now() + 3600000,
    };

    let updated = transactions;
    if (editingId) {
      updated = transactions.map(t => t.id === editingId ? newTx : t);
    } else {
      updated = [newTx, ...transactions];

      // Trigger notification and vibration for new transactions
      notifyTransaction(
        formData.type as 'income' | 'expense',
        parseInt(formData.amount),
        formData.merchant
      ).catch(err => console.warn('Notification failed:', err));
    }

    setTransactions(updated);
    localStorage.setItem("bazaar_transactions", JSON.stringify(updated));
    setOpenDialog(false);
    setEditingId(null);
    setFormData({ type: "debit", amount: "", merchant: "", category: "Groceries", paymentMethod: "Cash", paidBy: "You", notes: "", isBorrowed: false, lenderName: "", lenderPhone: "", isShared: false, receiptUrl: "", hasSplit: false, splitAmount1: "", splitAmount2: "", splitMethod1: "Cash", splitMethod2: "UPI" });
    toast({ title: "Transaction Saved", description: `₹${formData.amount} recorded` });
  };

  const handleEditTransaction = (tx: Transaction) => {
    if (!canEditTransaction(tx)) {
      toast({ title: "Cannot Edit", description: "You can only edit transactions within 1 hour", variant: "destructive" });
      return;
    }
    setEditingId(tx.id);
    setFormData({
      type: tx.type,
      amount: tx.amount.toString(),
      merchant: tx.merchant,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      paidBy: tx.paidBy,
      notes: tx.notes,
      isBorrowed: tx.isBorrowed,
      lenderName: tx.lenderName || "",
      lenderPhone: tx.lenderPhone || "",
      isShared: tx.isShared,
      receiptUrl: tx.receiptUrl || "",
      hasSplit: tx.hasSplit || false,
      splitAmount1: tx.splitAmount1?.toString() || "",
      splitAmount2: tx.splitAmount2?.toString() || "",
      splitMethod1: tx.splitMethod1 || "Cash",
      splitMethod2: tx.splitMethod2 || "UPI",
    });
    setOpenDialog(true);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && !canEditTransaction(tx)) {
      toast({ title: "Cannot Delete", description: "You can only delete transactions within 1 hour", variant: "destructive" });
      return;
    }
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem("bazaar_transactions", JSON.stringify(updated));
    toast({ title: "Transaction Deleted" });
  };

  const handleUpdatePrice = (id: string, newAmount: number) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && !canEditTransaction(tx)) {
      toast({ title: "Cannot Edit", description: "You can only edit transactions within 1 hour", variant: "destructive" });
      return;
    }
    const updated = transactions.map(t => t.id === id ? { ...t, amount: newAmount } : t);
    setTransactions(updated);
    localStorage.setItem("bazaar_transactions", JSON.stringify(updated));
    toast({ title: "Price Updated" });
  };

  const handleAddPocket = async () => {
    // Validate pocket name (required)
    if (!newPocketName.trim()) {
      toast({ title: "Required", description: "Enter a pocket name", variant: "destructive" });
      return;
    }

    try {
      // Use Supabase directly for more reliable pocket creation
      const { supabase } = await import("@/lib/supabaseClient");

      // Prepare pocket data with snake_case for Supabase
      const pocketData = {
        user_id: userId,
        name: newPocketName.trim(),
        amount: parseInt(newPocketAmount) || 0,
        type: newPocketType,
        icon: newPocketIcon,
        color: newPocketType === "savings" ? "bg-emerald-500" :
          newPocketType === "upi" ? "bg-purple-500" : "bg-blue-500",
        target_amount: newPocketType === "savings" && newPocketTarget ? parseInt(newPocketTarget) : null,
        deadline: newPocketType === "savings" && newPocketDeadline ? new Date(newPocketDeadline).toISOString() : null,
      };

      console.log("Creating pocket:", pocketData);

      const { data, error } = await supabase
        .from('pockets')
        .insert([pocketData])
        .select()
        .single();

      if (error) {
        console.error("Pocket creation error:", error);
        throw new Error(error.message);
      }

      console.log("Pocket created successfully:", data);

      // Refresh pockets list
      queryClient.invalidateQueries({ queryKey: ["pockets"] });

      // Close dialog and reset form
      setAddPocketOpen(false);
      setNewPocketName("");
      setNewPocketAmount("");
      setNewPocketTarget("");
      setNewPocketDeadline("");
      setNewPocketIcon("💰");
      setNewPocketType("cash");

      // Show success message
      toast({
        title: "✅ Pocket Created!",
        description: `${newPocketIcon} ${newPocketName} is ready to use`
      });
    } catch (error: any) {
      console.error("Pocket creation failed:", error);
      toast({
        title: "Failed to Create Pocket",
        description: error.message || "Please check your connection and try again",
        variant: "destructive"
      });
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(apiUrl("/api/pockets/transfer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fromPocketId: transferFrom,
          toPocketId: transferTo,
          amount: parseInt(transferAmount)
        })
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["pockets"] });
        setShowTransferDialog(false);
        setTransferFrom(null);
        setTransferTo(null);
        setTransferAmount("");
        toast({ title: "Transfer Complete" });
      } else {
        const data = await res.json();
        toast({ title: "Transfer Failed", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleAddMoneyToPocket = async (pocketId: number, amount: number) => {
    try {
      const res = await fetch(apiUrl(`/api/pockets/${pocketId}/add`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["pockets"] });
        toast({ title: "Money Added", description: `₹${amount} added to pocket` });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <MobileShell
      header={
        <div className="px-6 pt-6 pb-4 bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">{t('home.totalBalance')}</p>
              <h1 className="text-3xl font-heading font-bold text-foreground">{formatCurrency(netBalance)}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  Income {formatCurrency(totalIncome)} • Expense {formatCurrency(totalExpense)}
                </p>
                {user?.familyType && (user.familyType === 'couple' || user.familyType === 'joint') && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${user.familyType === 'couple' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                    {user.familyType === 'couple' ? '👫 Couple' : '👨‍👩‍👧‍👦 Joint Family'}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-50" onClick={() => toast({ title: t('home.notifications'), description: t('home.noNewNotifications') })}>
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border border-blue-100">
              {t('home.dailyBriefMessage', { amount: formatCurrency(getTodaySpending()) })}
            </div>
          </div>
          {/* Add Expense/Income Buttons */}
          <div className="flex gap-3 mt-4">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingId(null); setFormData({ type: "debit", amount: "", merchant: "", category: "Groceries", paymentMethod: "Cash", paidBy: "You", notes: "", isBorrowed: false, lenderName: "", lenderPhone: "", isShared: false, receiptUrl: "", hasSplit: false, splitAmount1: "", splitAmount2: "", splitMethod1: "Cash", splitMethod2: "UPI" }); }} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold">
                  <ArrowDownLeft className="w-4 h-4 mr-2" /> {t('home.addExpense')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? t('home.editExpense') : t('home.addExpense')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>{t('transaction.amount')} *</Label>
                    <Input type="number" placeholder="500" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value, type: "debit" })} />
                  </div>

                  {/* Merchant */}
                  <div className="space-y-2">
                    <Label>{t('transaction.merchant')} *</Label>
                    <Input placeholder="e.g. Zomato, Amazon" value={formData.merchant} onChange={(e) => setFormData({ ...formData, merchant: e.target.value })} />
                  </div>

                  {/* Category Grid */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>{t('transaction.category')} *</Label>
                      <button onClick={() => setShowAddCategory(!showAddCategory)} className="text-xs text-blue-600 hover:underline">{t('categories.addCustom')}</button>
                    </div>

                    {showAddCategory && (
                      <div className="flex gap-2 mb-2">
                        <Input placeholder="e.g. Pet Care" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="text-xs" />
                        <Button size="sm" onClick={() => {
                          if (newCategory.trim()) {
                            setCustomCategories([...customCategories, newCategory]);
                            setFormData({ ...formData, category: newCategory });
                            setNewCategory("");
                            setShowAddCategory(false);
                            toast({ title: "Category added", description: `"${newCategory}" created` });
                          }
                        }}>Add</Button>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.label}
                          onClick={() => setFormData({ ...formData, category: cat.label })}
                          className={cn(
                            "p-3 rounded-lg flex flex-col items-center gap-1 border-2 transition-all text-xs font-medium",
                            formData.category === cat.label ? "border-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                      {customCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={cn(
                            "p-3 rounded-lg flex flex-col items-center gap-1 border-2 transition-all text-xs font-medium",
                            formData.category === cat ? "border-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <span className="text-lg">🏷️</span>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date - Read Only */}
                  <div className="space-y-2">
                    <Label>{t('transaction.date')}</Label>
                    <Input disabled value={new Date().toLocaleDateString("en-IN")} />
                  </div>

                  {/* Borrowed Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('transaction.borrowed')}</Label>
                      <Switch checked={formData.isBorrowed} onCheckedChange={(val) => setFormData({ ...formData, isBorrowed: val })} />
                    </div>
                    {formData.isBorrowed && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-3">
                        <Input placeholder={t('transaction.lenderName')} value={formData.lenderName} onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })} />
                        <Input placeholder={t('transaction.lenderPhone')} value={formData.lenderPhone} onChange={(e) => setFormData({ ...formData, lenderPhone: e.target.value })} />
                      </div>
                    )}
                  </div>

                  {/* Paid By */}
                  <div className="space-y-2">
                    <Label>{t('transaction.paidBy')} *</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.paidBy} onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}>
                      <option>You</option>
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('transaction.paymentMethod')} *</Label>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.hasSplit} onChange={(e) => setFormData({ ...formData, hasSplit: e.target.checked, splitAmount1: "", splitAmount2: "" })} id="split-check" />
                        <label htmlFor="split-check" className="text-xs text-gray-600">{t('transaction.splitPayment')}</label>
                      </div>
                    </div>

                    {!formData.hasSplit ? (
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    ) : (
                      <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Method 1</Label>
                            <select className="w-full px-2 py-2 border text-xs rounded" value={formData.splitMethod1} onChange={(e) => setFormData({ ...formData, splitMethod1: e.target.value })}>
                              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Amount 1</Label>
                            <Input type="number" placeholder="0" value={formData.splitAmount1} onChange={(e) => setFormData({ ...formData, splitAmount1: e.target.value })} className="text-xs" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Method 2</Label>
                            <select className="w-full px-2 py-2 border text-xs rounded" value={formData.splitMethod2} onChange={(e) => setFormData({ ...formData, splitMethod2: e.target.value })}>
                              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs">Amount 2</Label>
                            <Input type="number" placeholder="0" value={formData.splitAmount2} onChange={(e) => setFormData({ ...formData, splitAmount2: e.target.value })} className="text-xs" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">Total must equal ₹{formData.amount || 0}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>{t('transaction.notes')}</Label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder={t('transaction.notesPlaceholder')} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                  </div>

                  {/* Shared Expense */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('transaction.sharedExpense')}</Label>
                      <Switch checked={formData.isShared} onCheckedChange={(val) => setFormData({ ...formData, isShared: val })} />
                    </div>
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label>{t('transaction.receipt')}</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setFormData({ ...formData, receiptUrl: event.target?.result as string });
                              toast({ title: "Receipt uploaded", description: file.name });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload" className="cursor-pointer">
                        <div className="text-2xl mb-2">📸</div>
                        <p className="text-xs text-gray-600">{t('transaction.uploadReceipt')}</p>
                        {formData.receiptUrl && <p className="text-xs text-green-600 mt-2">{t('transaction.receiptAttached')}</p>}
                      </label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpenDialog(false); setEditingId(null); }}>{t('common.cancel')}</Button>
                  <Button onClick={handleSaveTransaction} className="bg-red-600 hover:bg-red-700">{t('transaction.saveExpense')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
              {/* Trigger removed, controlled by FAB and manual setIncomeDialogOpen */}
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('transaction.addIncome')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('transaction.amount')} *</Label>
                    <Input type="number" placeholder="5000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value, type: "credit" })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('transaction.source')} *</Label>
                    <Input placeholder="e.g. Salary, Freelance, Bonus" value={formData.merchant} onChange={(e) => setFormData({ ...formData, merchant: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('transaction.category')} *</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      <option>Salary</option>
                      <option>Freelance</option>
                      <option>Business</option>
                      <option>Rental</option>
                      <option>Bonus</option>
                      <option>Refund</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('transaction.paymentMethod')} *</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                      {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('transaction.notes')}</Label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder={t('transaction.notesPlaceholder')} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">{t('common.cancel')}</Button>
                  <Button onClick={handleSaveTransaction} className="bg-green-600 hover:bg-green-700">{t('transaction.saveIncome')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      }
    >
      <div className="px-6 py-6 space-y-8">
        {/* Pockets Grid */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-bold">{t('home.myPockets')}</h2>
              <p className="text-xs text-muted-foreground">Organize money by source or purpose</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary h-8 px-2 text-xs font-medium"
              onClick={() => setShowTransferDialog(true)}
              title="Move money between pockets"
            >
              Transfer
            </Button>
          </div>
          {pocketsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pocketsError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm font-medium text-gray-700 mb-1">Failed to Load Pockets</p>
              <p className="text-xs text-gray-500 mb-4">
                {pocketsErrorDetails?.message || "Please check your connection"}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["pockets"] })}
              >
                Retry
              </Button>
            </div>
          ) : pockets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">What are Pockets?</h3>
              <p className="text-xs text-gray-600 mb-3 max-w-[280px]">
                Pockets help you organize money by source or purpose.
                Track cash, bank accounts, and savings separately!
              </p>

              {/* Visual Examples */}
              <div className="flex gap-2 mb-4">
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center shadow-sm">
                  <span className="text-lg">💵</span>
                  <p className="text-[10px] text-gray-600 mt-1 font-medium">₹5,000</p>
                  <p className="text-[8px] text-gray-400">Cash</p>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center shadow-sm">
                  <span className="text-lg">🏦</span>
                  <p className="text-[10px] text-gray-600 mt-1 font-medium">₹25,000</p>
                  <p className="text-[8px] text-gray-400">Bank</p>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-center shadow-sm">
                  <span className="text-lg">🎯</span>
                  <p className="text-[10px] text-gray-600 mt-1 font-medium">₹10,000</p>
                  <p className="text-[8px] text-gray-400">Savings</p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setAddPocketOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Your First Pocket
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {pockets.map((pocket) => (
                <PocketCard
                  key={pocket.id}
                  id={String(pocket.id)}
                  name={pocket.name}
                  type={pocket.type}
                  amount={pocket.amount || 0}
                  spent={pocket.spent || 0}
                  targetAmount={pocket.targetAmount || undefined}
                  deadline={pocket.deadline?.toString()}
                  monthlyContribution={pocket.monthlyContribution || undefined}
                  icon={pocket.icon || undefined}
                  color={pocket.color || "bg-blue-500"}
                  onAddMoney={(amount) => handleAddMoneyToPocket(pocket.id, amount)}
                  onTransfer={() => {
                    setTransferFrom(pocket.id);
                    setShowTransferDialog(true);
                  }}
                  onClick={() => setLocation(`/pocket/${pocket.id}`)}
                />
              ))}
              <button
                onClick={() => setAddPocketOpen(true)}
                className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[160px] text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-xs font-medium">Add Pocket</span>
              </button>
            </div>
          )}

          {/* Add Pocket Dialog - Rendered outside conditional so both empty state and grid can open it */}
          <Dialog open={addPocketOpen} onOpenChange={setAddPocketOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('home.addNewPocket')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Quick Presets */}
                <div className="space-y-2">
                  <Label>Quick Setup <span className="text-xs text-gray-400 font-normal">(tap to auto-fill)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: "💵", name: "Cash", type: "cash" },
                      { icon: "💼", name: "Salary Account", type: "bank" },
                      { icon: "🏦", name: "Savings", type: "savings" },
                      { icon: "🏠", name: "Household", type: "cash" },
                      { icon: "📱", name: "UPI Wallet", type: "upi" },
                      { icon: "✈️", name: "Travel Fund", type: "savings" },
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setNewPocketIcon(preset.icon);
                          setNewPocketName(preset.name);
                          setNewPocketType(preset.type);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs border flex items-center gap-1.5 transition-all",
                          newPocketName === preset.name
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                        )}
                      >
                        <span>{preset.icon}</span> {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Selector */}
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["💰", "💵", "🏦", "💳", "✈️", "🏠", "🚗", "📱", "🎯", "💼", "🛒", "⚡"].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewPocketIcon(emoji)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-xl border-2 transition-all",
                          newPocketIcon === emoji ? "border-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pocket Name */}
                <div className="space-y-2">
                  <Label>{t('home.pocketName')}</Label>
                  <Input
                    placeholder="E.g., Cash, Salary Account, Travel Fund"
                    value={newPocketName}
                    onChange={(e) => setNewPocketName(e.target.value)}
                  />
                </div>

                {/* Starting Balance */}
                <div className="space-y-2">
                  <Label>Starting Balance</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPocketAmount}
                    onChange={(e) => setNewPocketAmount(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400">Amount currently available in this pocket</p>
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                  <Label>{t('home.type')}</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={newPocketType}
                    onChange={(e) => setNewPocketType(e.target.value)}
                  >
                    <option value="cash">💵 Cash — Money in hand or at home</option>
                    <option value="bank">🏦 Bank — Savings or current account</option>
                    <option value="upi">📱 UPI — Paytm, PhonePe, GPay balance</option>
                    <option value="savings">🎯 Goal — Save for something specific</option>
                  </select>
                </div>

                {/* Savings Goal Fields */}
                {newPocketType === "savings" && (
                  <div className="bg-emerald-50 p-4 rounded-lg space-y-3 border border-emerald-100">
                    <p className="text-xs text-emerald-700 font-medium">🎯 Savings Goal Settings</p>
                    <div className="space-y-2">
                      <Label className="text-xs">Target Amount</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 50000"
                        value={newPocketTarget}
                        onChange={(e) => setNewPocketTarget(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Target Date</Label>
                      <Input
                        type="date"
                        value={newPocketDeadline}
                        onChange={(e) => setNewPocketDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddPocketOpen(false)}>{t('home.cancel')}</Button>
                <Button onClick={handleAddPocket} className={newPocketType === "savings" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                  {t('home.createPocket')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Transfer Dialog */}
          <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Between Pockets</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>From Pocket</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={transferFrom || ""}
                    onChange={(e) => setTransferFrom(parseInt(e.target.value))}
                  >
                    <option value="">Select source</option>
                    {pockets.length === 0 ? (
                      <option disabled>No pockets yet - create one first</option>
                    ) : (
                      pockets.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.icon || "💰"} {p.name} (₹{(p.amount || 0).toLocaleString()})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>To Pocket</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={transferTo || ""}
                    onChange={(e) => setTransferTo(parseInt(e.target.value))}
                  >
                    <option value="">Select destination</option>
                    {pockets.filter(p => p.id !== transferFrom).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.icon || "💰"} {p.name} (₹{(p.amount || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Cancel</Button>
                <Button onClick={handleTransfer} className="bg-blue-600 hover:bg-blue-700">
                  Transfer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* Quick Access Cards */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Quick Access</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Subscriptions Card */}
            <button
              onClick={() => setLocation("/subscriptions")}
              className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white text-left hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <p className="font-bold text-sm">Subscriptions</p>
              <p className="text-[10px] opacity-80">Track Netflix, Spotify...</p>
            </button>

            {/* Goals Card */}
            <button
              onClick={() => setLocation("/goals")}
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white text-left hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                  <span className="text-lg">🎯</span>
                </div>
              </div>
              <p className="font-bold text-sm">Goals</p>
              <p className="text-[10px] opacity-80">Save for your dreams</p>
            </button>

            {/* Shared Expenses Shortcuts Removed as per UX Requirement - "One feature = one clear location" */}
          </div>
        </section>

        {/* Transaction History */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('home.recentActivity')}</h2>
            <div className="flex gap-2 items-center">
              {showSearch && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 120, opacity: 1 }}>
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs"
                  />
                </motion.div>
              )}
              <Button variant="ghost" size="icon" className={cn("h-8 w-8", showSearch && "bg-gray-100")} onClick={() => setShowSearch(!showSearch)}>
                <Search className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8", filterType !== "all" && "text-primary bg-primary/10")}>
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterType("all")}>
                    All Transactions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("debit")}>
                    Expenses Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("credit")}>
                    Income Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {filterType !== "all" && <span className="text-[10px] font-bold text-primary uppercase">{filterType}</span>}
            </div>
          </div>

          {/* Expense/Income Toggle Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                filterType === "all"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("debit")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                filterType === "debit"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Expenses
            </button>
            <button
              onClick={() => setFilterType("credit")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                filterType === "credit"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Income
            </button>
          </div>

          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{transactions.length === 0 ? t('home.noTransactions') : t('home.noMatches')}</p>
              </div>
            ) : (
              filteredTransactions.map((tx, i) => {
                const canEdit = canEditTransaction(tx);
                const timeLeft = Math.max(0, Math.floor((tx.editDeadline - Date.now()) / 60000));

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={tx.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-lg">{tx.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{tx.merchant}</h3>
                          <p className="text-xs text-muted-foreground">{tx.category} • {tx.date} • {tx.paymentMethod}</p>
                          {tx.notes && <p className="text-xs text-gray-500 mt-1">{tx.notes}</p>}
                          {tx.isBorrowed && <p className="text-xs text-orange-600 font-medium">📌 Borrowed from {tx.lenderName}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold text-base", tx.type === "credit" ? "text-green-600" : "text-foreground")}>
                          {tx.type === "debit" ? "-" : "+"}{formatCurrency(tx.amount)}
                        </p>
                        {canEdit && <p className="text-[10px] text-blue-500 font-medium">{timeLeft}m left</p>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                      {canEdit && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditTransaction(tx)} className="flex-1 h-7 text-xs">
                            <Edit2 className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteTransaction(tx.id)} className="flex-1 h-7 text-xs">
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </>
                      )}
                      {tx.isBorrowed && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs flex-1">
                          <Check className="w-3 h-3 mr-1" /> Mark Settled
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-all hover:scale-105">
              <Plus className="h-8 w-8 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mb-2 w-48 bg-white/95 backdrop-blur-sm border-primary/20">
            <DropdownMenuItem onClick={() => {
              setEditingId(null);
              setFormData({ ...formData, type: "debit" }); // Reset form
              setOpenDialog(true);
            }} className="cursor-pointer py-3 focus:bg-red-50 focus:text-red-600">
              <ArrowDownLeft className="mr-2 h-4 w-4 text-red-500" />
              <span className="font-semibold">{t('home.addExpense')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setEditingId(null);
              setFormData({ ...formData, type: "credit" }); // Reset form
              setIncomeDialogOpen(true);
            }} className="cursor-pointer py-3 focus:bg-green-50 focus:text-green-600">
              <ArrowUpRight className="mr-2 h-4 w-4 text-green-500" />
              <span className="font-semibold">{t('home.addIncome')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </MobileShell>
  );
}
