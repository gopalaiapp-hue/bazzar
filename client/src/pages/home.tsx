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
import { useLocation } from "wouter";
import { useUser } from "@/context/UserContext";

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
  const { user } = useUser();
  const userId = user?.id;


  const { data: pockets = [], isLoading: pocketsLoading } = useQuery<Pocket[]>({
    queryKey: ["pockets", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/pockets/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch pockets");
      const data = await res.json();
      return data.pockets;
    },
    enabled: !!userId,
  });


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
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

  if (!userId) {
    return (
      <MobileShell>
        <div className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Please complete onboarding first.</p>
          <Button onClick={() => setLocation("/")}>Go to Onboarding</Button>
        </div>
      </MobileShell>
    );
  }

  const totalBalance = pockets.reduce((acc, pocket) => acc + (pocket.amount || 0), 0);

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
    if (!newPocketName || !newPocketAmount) {
      toast({ title: "Required", description: "Enter name and amount", variant: "destructive" });
      return;
    }
    try {
      const pocketData: any = {
        userId,
        name: newPocketName,
        amount: parseInt(newPocketAmount),
        type: newPocketType,
        icon: newPocketIcon,
        color: newPocketType === "savings" ? "bg-emerald-500" : "bg-blue-500"
      };

      // Add goal fields if it's a savings pocket
      if (newPocketType === "savings" && newPocketTarget) {
        pocketData.targetAmount = parseInt(newPocketTarget);
        if (newPocketDeadline) {
          pocketData.deadline = new Date(newPocketDeadline).toISOString();
        }
      }

      const res = await fetch("/api/pockets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pocketData)
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["pockets"] });
        setAddPocketOpen(false);
        setNewPocketName("");
        setNewPocketAmount("");
        setNewPocketTarget("");
        setNewPocketDeadline("");
        setNewPocketIcon("💰");
        toast({ title: "Pocket Added" });
      } else {
        toast({ title: "Failed", description: "Could not add pocket", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/pockets/transfer", {
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
      const res = await fetch(`/api/pockets/${pocketId}/add`, {
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
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t('home.totalBalance')}</p>
              <h1 className="text-3xl font-heading font-bold text-foreground">{formatCurrency(totalBalance)}</h1>
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

            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingId(null); setFormData({ type: "credit", amount: "", merchant: "", category: "Salary", paymentMethod: "Cash", paidBy: "You", notes: "", isBorrowed: false, lenderName: "", lenderPhone: "", isShared: false, receiptUrl: "", hasSplit: false, splitAmount1: "", splitAmount2: "", splitMethod1: "Cash", splitMethod2: "UPI" }); }} className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 font-bold">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> {t('home.addIncome')}
                </Button>
              </DialogTrigger>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('home.myPockets')}</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary h-8 px-2 text-xs font-medium"
              onClick={() => setShowTransferDialog(true)}
            >
              Transfer
            </Button>
          </div>
          {pocketsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <Dialog open={addPocketOpen} onOpenChange={setAddPocketOpen}>
                <DialogTrigger asChild>
                  <button className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[160px] text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Add Pocket</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('home.addNewPocket')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Icon Selector */}
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="flex gap-2 flex-wrap">
                        {["💰", "🏦", "💳", "✈️", "🏠", "🚗", "📱", "🎯", "💍", "🎓", "🛒", "⚡"].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setNewPocketIcon(emoji)}
                            className={cn(
                              "w-10 h-10 rounded-lg text-xl border-2 transition-all",
                              newPocketIcon === emoji ? "border-primary bg-primary/10" : "border-gray-200"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('home.pocketName')}</Label>
                      <Input placeholder="e.g. Vacation Fund" value={newPocketName} onChange={(e) => setNewPocketName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Starting Balance</Label>
                      <Input type="number" placeholder="0" value={newPocketAmount} onChange={(e) => setNewPocketAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('home.type')}</Label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={newPocketType} onChange={(e) => setNewPocketType(e.target.value)}>
                        <option value="cash">💵 Cash</option>
                        <option value="bank">🏦 Bank Account</option>
                        <option value="upi">📱 UPI Wallet</option>
                        <option value="savings">🎯 Savings Goal</option>
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
            </div>
          )}

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
                    {pockets.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.icon || "💰"} {p.name} (₹{(p.amount || 0).toLocaleString()})
                      </option>
                    ))}
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
    </MobileShell>
  );
}
