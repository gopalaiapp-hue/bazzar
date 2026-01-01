import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpRight, ArrowDownLeft, Plus, Calendar, Phone, Copy,
  CheckCircle2, Clock, Camera, Mic, Send, AlertTriangle, X,
  MessageCircle, ExternalLink, HandHeart
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Transaction {
  id: string;
  type: "gave" | "took";
  name: string;
  mobile?: string;
  upiId?: string;
  amount: number;
  date: string;
  dueDate: string;
  status: "pending" | "settled";
  note?: string;
}

// Mock data removed - start with empty state for real user data

import { useUser } from "@/context/UserContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api-config";
import type { LenaDena } from "@shared/schema";

export default function LenaDena() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");

  // Form state for adding new IOU
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newUpi, setNewUpi] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<"gave" | "took">("gave");

  // Settlement confirmation state
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [settlingTx, setSettlingTx] = useState<any>(null);
  const [confirmText, setConfirmText] = useState("");
  const [settleStep, setSettleStep] = useState<1 | 2>(1);

  // Fetch lena-dena entries from API
  const { data: entries = [], isLoading } = useQuery<LenaDena[]>({
    queryKey: ["lena-dena", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(apiUrl(`/api/lena-dena/${user.id}`));
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.entries || [];
    },
    enabled: !!user?.id
  });

  // Transform entries to Transaction format for backwards compatibility
  const transactions = entries.map(e => ({
    id: String(e.id),
    type: e.type as "gave" | "took",
    name: e.name,
    amount: e.amount,
    date: e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : "N/A",
    dueDate: e.dueDate ? new Date(e.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : "No due date",
    status: e.status as "pending" | "settled",
    note: e.notes
  }));

  const totalGave = transactions.filter(t => t.type === "gave" && t.status === "pending").reduce((acc, t) => acc + t.amount, 0);
  const totalTook = transactions.filter(t => t.type === "took" && t.status === "pending").reduce((acc, t) => acc + t.amount, 0);
  const net = totalGave - totalTook;

  const resetForm = () => {
    setNewName("");
    setNewMobile("");
    setNewUpi("");
    setNewAmount("");
    setNewDueDate("");
    setNewNote("");
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(apiUrl("/api/lena-dena"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lena-dena"] });
      resetForm();
      setAddDialogOpen(false);
      toast({
        title: addType === "gave" ? "💸 Money Lent Recorded" : "📥 Borrowing Recorded",
        description: newDueDate ? `Reminder set for due date` : "No due date set",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update mutation (for settlement)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(apiUrl(`/api/lena-dena/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lena-dena"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleAdd = () => {
    if (!user?.id || !newName || !newAmount) {
      toast({ title: "Missing Info", description: "Name and amount are required", variant: "destructive" });
      return;
    }

    if (!newDueDate) {
      toast({ title: "Missing Info", description: "Due date is required", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      userId: user.id,
      type: addType,
      name: newName,
      amount: parseFloat(newAmount),
      dueDate: newDueDate,
      notes: newNote || null,
    });
  };

  const openSettleDialog = (tx: any) => {
    setSettlingTx(tx);
    setSettleStep(1);
    setConfirmText("");
    setSettleDialogOpen(true);
  };

  const handleSettle = () => {
    if (confirmText !== "SETTLED") {
      toast({ title: "Confirmation Required", description: "Please type SETTLED to confirm", variant: "destructive" });
      return;
    }

    if (settlingTx) {
      updateMutation.mutate({ id: parseInt(settlingTx.id), data: { status: "settled" } });
      setSettleDialogOpen(false);
      setSettlingTx(null);
      setConfirmText("");
      toast({
        title: "✅ Settled!",
        description: `₹${settlingTx.amount.toLocaleString()} with ${settlingTx.name} marked as settled`,
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} Copied!`, description: text });
  };

  const openWhatsApp = (tx: Transaction) => {
    const message = `Hi ${tx.name}, this is a reminder about ₹${tx.amount.toLocaleString()} ${tx.type === "gave" ? "I lent you" : "I borrowed from you"} on ${tx.date}. ${tx.type === "gave" ? "Please pay when convenient." : "I'll pay you back soon."} ${tx.upiId ? `UPI: ${tx.upiId}` : ""}`;
    const url = `https://wa.me/91${tx.mobile}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const openUpiPay = (tx: Transaction) => {
    if (tx.upiId) {
      const upiUrl = `upi://pay?pa=${tx.upiId}&pn=${encodeURIComponent(tx.name)}&am=${tx.amount}&tn=${encodeURIComponent(tx.note || "Payment")}`;
      window.location.href = upiUrl;
    }
  };

  const openAddDialog = (type: "gave" | "took") => {
    setAddType(type);
    resetForm();
    setAddDialogOpen(true);
  };

  return (
    <MobileShell>
      <div className="p-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{t('lenaDena.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('lenaDena.subtitle')}</p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => openAddDialog("took")}
            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4 mr-2" /> I Took
          </Button>
          <Button
            onClick={() => openAddDialog("gave")}
            className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 border border-green-100 font-bold shadow-sm"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" /> I Gave
          </Button>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-orange-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-orange-400 to-red-400" />
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lena Hai</p>
              <p className="text-xl font-black text-green-600">₹{totalGave.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dena Hai</p>
              <p className="text-xl font-black text-red-600">₹{totalTook.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Net</p>
              <p className={cn("text-xl font-black", net >= 0 ? "text-blue-600" : "text-orange-600")}>
                {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "pending", "settled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold capitalize transition-all",
                filter === f
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {transactions.filter(t => filter === "all" || t.status === filter).map((tx) => (
            <div
              key={tx.id}
              className={cn(
                "bg-white p-4 rounded-2xl border shadow-sm transition-all",
                tx.status === "settled"
                  ? "opacity-60 border-gray-100"
                  : "border-gray-200 hover:border-blue-200 hover:shadow-md"
              )}
            >
              {/* Main Row */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className={cn(
                    "h-12 w-12 border-2",
                    tx.type === "gave" ? "border-green-200" : "border-red-200"
                  )}>
                    <AvatarFallback className={cn(
                      "font-bold",
                      tx.type === "gave" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {tx.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{tx.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {tx.dueDate}</span>
                    </div>
                    {tx.note && (
                      <p className="text-[10px] text-gray-400 mt-1 italic">"{tx.note}"</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className={cn(
                    "font-black text-lg",
                    tx.type === "gave" ? "text-green-600" : "text-red-600"
                  )}>
                    {tx.type === "gave" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                  </p>
                  {tx.status === "settled" && (
                    <span className="text-green-600 text-[10px] font-bold flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Settled
                    </span>
                  )}
                </div>
              </div>

              {/* Contact & Action Row */}
              {tx.status === "pending" && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {/* Contact Info */}
                  <div className="flex gap-2">
                    {tx.mobile && (
                      <button
                        onClick={() => copyToClipboard(tx.mobile!, "Mobile")}
                        className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span className="max-w-[80px] truncate">{tx.mobile}</span>
                        <Copy className="w-2.5 h-2.5 text-gray-400" />
                      </button>
                    )}
                    {tx.upiId && (
                      <button
                        onClick={() => copyToClipboard(tx.upiId!, "UPI ID")}
                        className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
                      >
                        <span className="max-w-[80px] truncate">{tx.upiId}</span>
                        <Copy className="w-2.5 h-2.5 text-purple-400" />
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {tx.mobile && (
                      <button
                        onClick={() => openWhatsApp(tx)}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    {tx.upiId && tx.type === "took" && (
                      <button
                        onClick={() => openUpiPay(tx)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        Pay <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => openSettleDialog(tx)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {transactions.filter(t => filter === "all" || t.status === filter).length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mb-4">
                <HandHeart className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Transactions Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                Start tracking money that you've lent or borrowed from friends and family. Never forget who owes what!
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => openAddDialog("took")}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  size="sm"
                >
                  <ArrowDownLeft className="w-4 h-4 mr-1" /> I Borrowed
                </Button>
                <Button
                  onClick={() => openAddDialog("gave")}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <ArrowUpRight className="w-4 h-4 mr-1" /> I Lent
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add IOU Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {addType === "gave" ? (
                <><ArrowUpRight className="w-5 h-5 text-green-600" /> Record Money Lent</>
              ) : (
                <><ArrowDownLeft className="w-5 h-5 text-red-600" /> Record Borrowing</>
              )}
            </DialogTitle>
            <DialogDescription>
              Add contact details to easily send reminders and track payments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-600">
                {addType === "gave" ? "To Whom" : "From Whom"} *
              </Label>
              <Input
                placeholder="Name (e.g., Rohan, Mom)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600">Mobile No.</Label>
                <Input
                  placeholder="9876543210"
                  type="tel"
                  maxLength={10}
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600">UPI ID</Label>
                <Input
                  placeholder="name@upi"
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600">Amount *</Label>
                <Input
                  placeholder="5000"
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-600">Due Date</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-600">Note (optional)</Label>
              <Input
                placeholder="For movie tickets, dinner, etc."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAdd}
              className={cn(
                "w-full font-bold",
                addType === "gave" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
            >
              <Plus className="w-4 h-4 mr-2" /> Save & Set Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement Confirmation Dialog (2-step) */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="max-w-[380px]">
          {settlingTx && (
            <>
              {settleStep === 1 ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Confirm Settlement
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to mark this as settled?
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Person</span>
                        <span className="font-bold">{settlingTx.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Amount</span>
                        <span className={cn(
                          "font-bold",
                          settlingTx.type === "gave" ? "text-green-600" : "text-red-600"
                        )}>
                          ₹{settlingTx.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type</span>
                        <span className="font-medium capitalize">{settlingTx.type === "gave" ? "You Lent" : "You Borrowed"}</span>
                      </div>
                      {settlingTx.mobile && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Mobile</span>
                          <span className="font-medium">{settlingTx.mobile}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                      <p className="text-xs text-orange-700">
                        <strong>⚠️ This action cannot be undone.</strong> Make sure the payment has been made before marking as settled.
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setSettleDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={() => setSettleStep(2)} className="flex-1 bg-orange-500 hover:bg-orange-600">
                      Continue
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Final Confirmation
                    </DialogTitle>
                    <DialogDescription>
                      Type <strong>SETTLED</strong> to confirm this transaction is complete.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4 space-y-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-black text-gray-800">₹{settlingTx.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 mt-1">with {settlingTx.name}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-600">Type SETTLED to confirm</Label>
                      <Input
                        placeholder="SETTLED"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                        className="text-center font-mono text-lg tracking-widest"
                      />
                    </div>
                  </div>

                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setSettleStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleSettle}
                      disabled={confirmText !== "SETTLED"}
                      className={cn(
                        "flex-1",
                        confirmText === "SETTLED"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-300 cursor-not-allowed"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Settled
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
