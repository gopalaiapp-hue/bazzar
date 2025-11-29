import React, { useState, useEffect } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { PocketCard } from "@/components/ui/pocket-card";
import { MOCK_POCKETS } from "@/lib/mock-data";
import { Bell, Search, Filter, Plus, ArrowUpRight, ArrowDownLeft, Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  });

  const totalBalance = MOCK_POCKETS.reduce((acc, pocket) => acc + pocket.amount, 0);

  // Calculate today's spending
  const getTodaySpending = () => {
    const today = new Date().toLocaleDateString("en-IN");
    return transactions
      .filter(tx => tx.date === today && tx.type === "debit")
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bazaar_transactions");
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

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

    const newTx: Transaction = {
      id: editingId || `t${Date.now()}`,
      type: formData.type as "debit" | "credit",
      amount: parseInt(formData.amount),
      merchant: formData.merchant,
      category: formData.category,
      icon: CATEGORIES.find(c => c.label === formData.category)?.icon || "💳",
      date: new Date().toLocaleDateString("en-IN"),
      paymentMethod: formData.paymentMethod,
      paidBy: formData.paidBy,
      notes: formData.notes,
      isBorrowed: formData.isBorrowed,
      lenderName: formData.lenderName,
      lenderPhone: formData.lenderPhone,
      isShared: formData.isShared,
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
    setFormData({ type: "debit", amount: "", merchant: "", category: "Groceries", paymentMethod: "Cash", paidBy: "You", notes: "", isBorrowed: false, lenderName: "", lenderPhone: "", isShared: false });
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

  return (
    <MobileShell
      header={
        <div className="px-6 pt-6 pb-4 bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
              <h1 className="text-3xl font-heading font-bold text-foreground">{formatCurrency(totalBalance)}</h1>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-50">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border border-blue-100">
              Daily Brief: You spent {formatCurrency(getTodaySpending())} today
            </div>
          </div>
          {/* Add Expense/Income Buttons */}
          <div className="flex gap-3 mt-4">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingId(null); setFormData({ type: "debit", amount: "", merchant: "", category: "Groceries", paymentMethod: "Cash", paidBy: "You", notes: "", isBorrowed: false, lenderName: "", lenderPhone: "", isShared: false }); }} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold">
                  <ArrowDownLeft className="w-4 h-4 mr-2" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input type="number" placeholder="500" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value, type: "debit"})} />
                  </div>

                  {/* Merchant */}
                  <div className="space-y-2">
                    <Label>Merchant / Shop Name *</Label>
                    <Input placeholder="e.g. Zomato, Amazon" value={formData.merchant} onChange={(e) => setFormData({...formData, merchant: e.target.value})} />
                  </div>

                  {/* Category Grid */}
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.label}
                          onClick={() => setFormData({...formData, category: cat.label})}
                          className={cn(
                            "p-3 rounded-lg flex flex-col items-center gap-1 border-2 transition-all text-xs font-medium",
                            formData.category === cat.label ? "border-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date - Read Only */}
                  <div className="space-y-2">
                    <Label>Date (Cannot Change)</Label>
                    <Input disabled value={new Date().toLocaleDateString("en-IN")} />
                  </div>

                  {/* Borrowed Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Borrowed from someone?</Label>
                      <Switch checked={formData.isBorrowed} onCheckedChange={(val) => setFormData({...formData, isBorrowed: val})} />
                    </div>
                    {formData.isBorrowed && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-3">
                        <Input placeholder="Lender's name" value={formData.lenderName} onChange={(e) => setFormData({...formData, lenderName: e.target.value})} />
                        <Input placeholder="Lender's phone (optional)" value={formData.lenderPhone} onChange={(e) => setFormData({...formData, lenderPhone: e.target.value})} />
                      </div>
                    )}
                  </div>

                  {/* Paid By */}
                  <div className="space-y-2">
                    <Label>Paid By *</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.paidBy} onChange={(e) => setFormData({...formData, paidBy: e.target.value})}>
                      <option>You</option>
                      <option>Spouse</option>
                      <option>Parent</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                      {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Add any additional details..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
                  </div>

                  {/* Shared Expense */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Shared Expense</Label>
                      <Switch checked={formData.isShared} onCheckedChange={(val) => setFormData({...formData, isShared: val})} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpenDialog(false); setEditingId(null); }}>Cancel</Button>
                  <Button onClick={handleSaveTransaction} className="bg-red-600 hover:bg-red-700">Save Expense</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingId(null); setFormData({ type: "credit", amount: "", merchant: "", category: "Salary", paymentMethod: "Cash", paidBy: "You", notes: "", isBorrowed: false, lenderName: "", lenderPhone: "", isShared: false }); }} className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 font-bold">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Add Income
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Income</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input type="number" placeholder="5000" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value, type: "credit"})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Source *</Label>
                    <Input placeholder="e.g. Salary, Freelance, Bonus" value={formData.merchant} onChange={(e) => setFormData({...formData, merchant: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option>Salary</option>
                      <option>Freelance</option>
                      <option>Business</option>
                      <option>Rental</option>
                      <option>Bonus</option>
                      <option>Refund</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                      {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Add any details..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleSaveTransaction} className="bg-green-600 hover:bg-green-700">Save Income</Button>
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
            <h2 className="text-lg font-bold">My Pockets</h2>
            <Button variant="ghost" size="sm" className="text-primary h-8 px-2 text-xs font-medium">Manage</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {MOCK_POCKETS.map((pocket) => (
              <PocketCard key={pocket.id} {...pocket} />
            ))}
            <button className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[140px] text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-colors">
              <Plus className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">Add Pocket</span>
            </button>
          </div>
        </section>

        {/* Transaction History */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet. Add your first expense or income!</p>
              </div>
            ) : (
              transactions.map((tx, i) => {
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
