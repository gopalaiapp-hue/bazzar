import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Heart, Plane, Gift, TrendingUp, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import generatedPolaroid from '@assets/generated_images/couple_polaroid_photo_frame_with_hearts_for_finance_app.png';

export default function Couple() {
  return (
    <MobileShell>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
              <Heart className="w-4 h-4 text-pink-300 absolute top-0 left-1/4 animate-pulse" />
              <Heart className="w-6 h-6 text-red-300 absolute top-10 right-1/4 animate-bounce" />
           </div>
           <h1 className="text-3xl font-heading font-bold text-foreground flex items-center justify-center gap-2">
             We <Heart className="w-8 h-8 text-red-500 fill-red-500" />
           </h1>
           <p className="text-muted-foreground text-sm">Arjun & Priya's Money Zone</p>
        </div>

        {/* Love Score */}
        <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-red-500" />
          <h2 className="text-sm font-bold text-pink-600 uppercase tracking-wider mb-2">This Month's Love Score</h2>
          <div className="text-5xl font-black text-gray-900 mb-2">92<span className="text-2xl text-gray-400 font-medium">/100</span></div>
          <p className="text-xs text-muted-foreground">Great job! Equal spending & no fights.</p>
          
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-12 w-12 border-2 border-blue-200 mb-2">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <span className="text-xs font-bold">You Spent</span>
              <span className="text-sm font-semibold">₹18,400</span>
            </div>
            <div className="h-12 w-[1px] bg-gray-100" />
             <div className="flex flex-col items-center">
              <Avatar className="h-12 w-12 border-2 border-pink-200 mb-2">
                 <AvatarImage src="https://github.com/shadcn.png" /> {/* In real app use different image */}
                <AvatarFallback>PK</AvatarFallback>
              </Avatar>
              <span className="text-xs font-bold">Priya Spent</span>
              <span className="text-sm font-semibold text-pink-600">₹12,400</span>
            </div>
          </div>
          <div className="mt-4 bg-pink-50 text-pink-700 text-xs font-bold py-2 px-4 rounded-full inline-block">
            Priya owes dinner tonight! 🍕
          </div>
        </div>

        {/* Polaroid Memory */}
        <div className="bg-white p-3 pb-8 rounded-sm shadow-xl rotate-1 mx-auto max-w-[280px] border border-gray-200">
           <div className="aspect-square bg-gray-100 mb-4 overflow-hidden rounded-sm">
             <img src={generatedPolaroid} className="w-full h-full object-cover" alt="Couple" />
           </div>
           <p className="text-center font-handwriting text-lg text-gray-600 font-bold">Italy Trip Dec 2026 🇮🇹</p>
           <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
             <div className="bg-green-500 h-full w-[54%]" />
           </div>
           <p className="text-center text-[10px] text-gray-400 mt-1">₹3.8L / ₹7L Saved</p>
        </div>

        {/* Shaadi Tracker */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-orange-900">Shaadi Gift Vault</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
             <div className="bg-white/50 p-2 rounded-lg">
                <p className="text-[10px] text-orange-700 uppercase font-bold">Received</p>
                <p className="font-bold text-orange-900">₹4.2L</p>
             </div>
             <div className="bg-white/50 p-2 rounded-lg">
                <p className="text-[10px] text-orange-700 uppercase font-bold">Spent</p>
                <p className="font-bold text-orange-900">₹2.8L</p>
             </div>
             <div className="bg-white p-2 rounded-lg shadow-sm border border-orange-100">
                <p className="text-[10px] text-green-700 uppercase font-bold">Saved</p>
                <p className="font-bold text-green-700">₹1.4L</p>
             </div>
          </div>
        </div>

      </div>
    </MobileShell>
  );
}
