import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpRight, ArrowDownLeft, Plus, Calendar, 
  CheckCircle2, Clock, Camera, Mic
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "gave" | "took";
  name: string;
  amount: number;
  date: string;
  dueDate: string;
  status: "pending" | "settled";
}

const MOCK_LANA_DENA: Transaction[] = [
  { id: "1", type: "gave", name: "Rohan (Friend)", amount: 5000, date: "28 Nov", dueDate: "15 Dec", status: "pending" },
  { id: "2", type: "took", name: "Mom", amount: 10000, date: "20 Nov", dueDate: "10 Jan", status: "pending" },
  { id: "3", type: "gave", name: "Office Colleague", amount: 500, date: "15 Nov", dueDate: "16 Nov", status: "settled" },
];

export default function LenaDena() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_LANA_DENA);
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  
  const totalGave = transactions.filter(t => t.type === "gave" && t.status === "pending").reduce((acc, t) => acc + t.amount, 0);
  const totalTook = transactions.filter(t => t.type === "took" && t.status === "pending").reduce((acc, t) => acc + t.amount, 0);
  const net = totalGave - totalTook;

  const handleAdd = (type: "gave" | "took") => {
    const newTx: Transaction = {
      id: Date.now().toString(),
      type,
      name: "New Person",
      amount: type === "gave" ? 2000 : 5000,
      date: "Today",
      dueDate: "Next Week",
      status: "pending"
    };
    setTransactions([newTx, ...transactions]);
    toast({
      title: type === "gave" ? "Money Lent Recorded" : "Money Borrowed Recorded",
      description: `Reminder set for due date.`,
    });
  };

  const handleSettle = (id: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: "settled" } : t));
    toast({
      title: "Settled!",
      description: "Marked as paid via Cash/UPI.",
    });
  };

  return (
    <MobileShell>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-heading font-bold text-foreground">Lena-Dena</h1>
             <p className="text-muted-foreground text-sm">Track loans & borrowings</p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 font-bold">
                  <ArrowDownLeft className="w-4 h-4 mr-1" /> I Took
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Borrowing</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>From Whom?</Label><Input placeholder="Mom, Friend..." /></div>
                  <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" placeholder="10000" /></div>
                  <div className="space-y-2"><Label>Return Date</Label><Input type="date" /></div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd("took")} className="w-full">Save Reminder</Button></DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-50 text-green-600 hover:bg-green-100 border-green-100 font-bold">
                  <ArrowUpRight className="w-4 h-4 mr-1" /> I Gave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Lending</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>To Whom?</Label><Input placeholder="Name..." /></div>
                  <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" placeholder="5000" /></div>
                  <div className="space-y-2"><Label>Due Date</Label><Input type="date" /></div>
                </div>
                <DialogFooter><Button onClick={() => handleAdd("gave")} className="w-full">Set Reminder</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-orange-400 to-red-400" />
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lena Hai</p>
              <p className="text-lg font-bold text-green-600">₹{totalGave.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dena Hai</p>
              <p className="text-lg font-bold text-red-600">₹{totalTook.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
              <p className={cn("text-lg font-bold", net >= 0 ? "text-blue-600" : "text-orange-600")}>
                {net >= 0 ? '+' : ''}₹{net.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["all", "pending", "settled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors",
                filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          {transactions.filter(t => filter === "all" || t.status === filter).map((tx) => (
            <div 
              key={tx.id} 
              className={cn(
                "group relative bg-white/80 backdrop-blur-sm p-4 rounded-xl border shadow-sm flex justify-between items-center transition-all",
                tx.status === "settled" ? "opacity-60 grayscale border-gray-100" : "border-gray-200 hover:border-blue-200 hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  tx.type === "gave" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {tx.type === "gave" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{tx.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {tx.dueDate}</span>
                    {tx.status === "settled" && <span className="text-green-600 font-bold flex items-center ml-1"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Settled</span>}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={cn("font-bold text-base", tx.type === "gave" ? "text-green-600" : "text-red-600")}>
                  ₹{tx.amount.toLocaleString()}
                </p>
                {tx.status === "pending" && (
                   <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleSettle(tx.id)} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                        Mark Settled
                      </button>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-4 pt-4 opacity-50">
          <div className="flex flex-col items-center gap-1">
             <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center"><Camera className="w-4 h-4 text-gray-500" /></div>
             <span className="text-[10px] font-medium text-gray-500">Add Photo</span>
          </div>
          <div className="flex flex-col items-center gap-1">
             <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center"><Mic className="w-4 h-4 text-gray-500" /></div>
             <span className="text-[10px] font-medium text-gray-500">Voice Note</span>
          </div>
        </div>

      </div>
    </MobileShell>
  );
}
