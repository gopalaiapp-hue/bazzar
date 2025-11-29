import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Users, Share2, Shield, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Family() {
  return (
    <MobileShell>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-heading font-bold">Family Vault</h1>
            <p className="text-muted-foreground text-sm">Manage shared expenses</p>
          </div>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Users className="w-4 h-4 mr-2" /> Invite
          </Button>
        </div>

        {/* Family Members */}
        <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Members</h3>
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-14 w-14 border-2 border-primary p-1 bg-white">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">You</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50">
              <div className="h-14 w-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-xs font-medium">Spouse</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50">
              <div className="h-14 w-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-xs font-medium">Parent</span>
            </div>
          </div>
        </section>

        {/* Shared Pockets */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Shared Goals</h3>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Household Expenses</h4>
                <p className="text-xs text-muted-foreground">Split 50:50</p>
              </div>
            </div>
            <Button variant="outline" size="sm">View</Button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Emergency Fund</h4>
                <p className="text-xs text-muted-foreground">Target: ₹5 Lakh</p>
              </div>
            </div>
            <Button variant="outline" size="sm">View</Button>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
