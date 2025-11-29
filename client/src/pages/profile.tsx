import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  User, Settings, CreditCard, Users, Bell, Lock, 
  Smartphone, Download, Share2, HelpCircle, LogOut, 
  ChevronRight, Trash2, Shield, Moon, Sun, Palette
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  return (
    <MobileShell>
      <div className="pb-8">
        {/* Header Profile Card */}
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Arjun Kumar</h1>
              <p className="text-muted-foreground text-sm">+91 98765 43210</p>
              <div className="flex gap-2 mt-2">
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Family Head</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Total Net Worth</p>
              <h2 className="text-2xl font-bold">₹ 48,72,410</h2>
            </div>
            <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-6">
          
          {/* Account & Family */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Account & Family</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MenuItem icon={CreditCard} label="Manage Accounts" sublabel="Banks, UPI, Wallets" />
              <Separator />
              <MenuItem icon={Users} label="Family & Nominee" sublabel="Add spouse, parents, nominee" />
            </div>
          </section>

          {/* App Settings */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">App Settings</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MenuItem icon={Bell} label="Notifications" sublabel="Daily brief time, Quiet hours" />
              <Separator />
              <MenuItem icon={Lock} label="App Lock & Privacy" sublabel="Biometric, Hide pockets" />
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Theme & Language</p>
                    <p className="text-xs text-muted-foreground">English • Light Mode</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Lite Mode</p>
                    <p className="text-xs text-muted-foreground">Big fonts for parents</p>
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </section>

          {/* Data & Rewards */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Data & Rewards</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <MenuItem icon={Download} label="Backup & Export" sublabel="Download Excel/PDF report" />
               <Separator />
               <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer bg-green-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">Refer & Earn ₹200</p>
                    <p className="text-xs text-green-700">Invite friends to BazaarBudget</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-green-300" />
              </div>
            </div>
          </section>

          {/* Support & Danger Zone */}
          <section className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MenuItem icon={HelpCircle} label="Help & Support" sublabel="Chat on WhatsApp" />
              <Separator />
              <button className="w-full flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-red-600">Logout</p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="pt-4 text-center">
              <button className="text-xs text-muted-foreground hover:text-red-500 flex items-center justify-center w-full gap-2 py-2">
                <Trash2 className="w-3 h-3" /> Delete Account Permanently
              </button>
              <p className="text-[10px] text-gray-400 mt-2">Version 1.0.0 (Beta)</p>
            </div>
          </section>
        </div>
      </div>
    </MobileShell>
  );
}

function MenuItem({ icon: Icon, label, sublabel, onClick }: any) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </div>
  );
}
