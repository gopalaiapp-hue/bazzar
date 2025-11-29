import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, Utensils, Receipt, Gift, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import generatedMeme from '@assets/generated_images/circular_budget_progress_with_warning_meme_for_budget_app.png';

const BUDGETS = [
  { id: 1, category: "Groceries", limit: 8000, spent: 6560, icon: ShoppingBag, color: "text-green-600 bg-green-100" },
  { id: 2, category: "Eating Out", limit: 4000, spent: 3800, icon: Utensils, color: "text-orange-600 bg-orange-100" },
  { id: 3, category: "Shopping", limit: 6000, spent: 6200, icon: Gift, color: "text-purple-600 bg-purple-100" },
  { id: 4, category: "EMI & Bills", limit: 15000, spent: 15000, icon: Receipt, color: "text-blue-600 bg-blue-100" },
];

export default function Budgets() {
  return (
    <MobileShell>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Smart Budgets</h1>
            <p className="text-muted-foreground text-sm">November 2025</p>
          </div>
          <Button size="sm" variant="outline">Edit Limits</Button>
        </div>

        {/* Alert Card */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
           <img src={generatedMeme} className="w-16 h-16 rounded-lg object-cover" alt="Angry meme" />
           <div>
             <h3 className="font-bold text-red-700 text-sm">Budget Over!</h3>
             <p className="text-xs text-red-600 mt-1 leading-relaxed">
               Shopping limit crossed by ₹200. <br/>
               <span className="font-bold">"Priya se pooch lo ab!"</span>
             </p>
           </div>
        </div>

        <div className="grid gap-4">
          {BUDGETS.map((b) => {
            const percentage = (b.spent / b.limit) * 100;
            const isOver = percentage > 100;
            const isWarning = percentage > 80 && !isOver;

            return (
              <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", b.color)}>
                      <b.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{b.category}</h3>
                      <p className="text-xs text-muted-foreground">
                         Limit: ₹{b.limit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold", isOver ? "text-red-600" : "text-foreground")}>
                      ₹{b.spent.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">spent</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className={cn(isOver ? "text-red-600" : isWarning ? "text-orange-600" : "text-green-600")}>
                      {Math.round(percentage)}% used
                    </span>
                    {isOver && <span className="text-red-600 flex items-center"><ShieldAlert className="w-3 h-3 mr-1" /> Blocked</span>}
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={cn("h-2", isOver ? "bg-red-100" : "bg-gray-100")} 
                    indicatorClassName={isOver ? "bg-red-600" : isWarning ? "bg-orange-500" : "bg-green-500"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
