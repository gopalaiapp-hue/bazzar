import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { PocketCard } from "@/components/ui/pocket-card";
import { MOCK_POCKETS, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { Bell, Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  const totalBalance = MOCK_POCKETS.reduce((acc, pocket) => acc + pocket.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
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
              Daily Brief: You spent ₹1,840 today
            </div>
          </div>
        </div>
      }
    >
      <div className="px-6 py-6 space-y-8">
        {/* Pockets Grid */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">My Pockets</h2>
            <Button variant="ghost" size="sm" className="text-primary h-8 px-2 text-xs font-medium">
              Manage
            </Button>
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

        {/* Recent Transactions */}
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
            {MOCK_TRANSACTIONS.map((tx, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={tx.id} 
                className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-lg">
                    {tx.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{tx.merchant}</h3>
                    <p className="text-xs text-muted-foreground">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <div className={`font-bold text-sm ${tx.type === 'credit' ? 'text-green-600' : 'text-foreground'}`}>
                  {tx.type === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
