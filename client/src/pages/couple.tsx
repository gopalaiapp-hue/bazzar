import React, { useState, useMemo } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Heart, Plane, Gift, Settings, BarChart3, Trophy, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// FairShare Components
import { CoupleComparisonCard } from "@/components/ui/couple-comparison-card";
import { FairnessScoreCard } from "@/components/ui/fairness-score-card";
import { PointsCard } from "@/components/ui/points-card";
import { RewardTierCard } from "@/components/ui/reward-tier-card";

// FairShare utilities & types
import {
  calculateSavingsRate,
  calculatePoints,
  comparePartners,
  getRewardTier,
  getNextTierProgress,
  generateMockPartnerSummary,
  getCurrentMonth,
  loadFairShareData,
  saveFairShareData,
  formatCurrencyShort
} from "@/lib/fairshare-utils";
import {
  REWARD_TIERS,
  DEFAULT_FAIRSHARE_SETTINGS,
  type MonthlySummary,
  type FairShareSettings
} from "@/lib/fairshare-types";

import generatedPolaroid from '@assets/generated_images/couple_polaroid_photo_frame_with_hearts_for_finance_app.png';

export default function Couple() {
  const { user, familyType } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "rewards" | "settings">("overview");

  // Fetch linked family members (users who joined via invite code)
  const { data: linkedMembers = [] } = useQuery<any[]>({
    queryKey: ["linkedMembers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/members/${user.id}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.members || [];
    },
    enabled: !!user?.id
  });

  // Fetch family members (manually added)
  const { data: familyMembers = [] } = useQuery<any[]>({
    queryKey: ["familyMembers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/family/${user.id}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.members || [];
    },
    enabled: !!user?.id
  });

  // Get partner info (first linked member or first family member with spouse/partner relationship)
  const partner = useMemo(() => {
    // Check linked members first (actual users who joined)
    if (linkedMembers.length > 0) {
      return linkedMembers[0];
    }
    // Check manually added family members
    const spouseRelations = ["spouse", "wife", "husband", "partner"];
    const spouseMember = familyMembers.find(m =>
      spouseRelations.includes(m.relationship?.toLowerCase())
    );
    if (spouseMember) {
      return { name: spouseMember.name, id: spouseMember.id };
    }
    return null;
  }, [linkedMembers, familyMembers]);

  // Settings state
  const [settings, setSettings] = useState<FairShareSettings>(() => {
    if (user?.id) {
      const stored = loadFairShareData(user.id);
      return stored.settings || { ...DEFAULT_FAIRSHARE_SETTINGS, partnerName: partner?.name || "Partner" };
    }
    return { ...DEFAULT_FAIRSHARE_SETTINGS, partnerName: partner?.name || "Partner" };
  });



  // Calculate user summary from localStorage transactions
  const userSummary = useMemo<MonthlySummary>(() => {
    const currentMonth = getCurrentMonth();
    const transactions = JSON.parse(localStorage.getItem("bazaar_transactions") || "[]");

    // Calculate spending for current month
    const monthTransactions = transactions.filter((tx: any) => {
      const txDate = new Date(tx.date);
      const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      return txMonth === currentMonth;
    });

    const totalSpent = monthTransactions
      .filter((tx: any) => tx.type === "debit")
      .reduce((sum: number, tx: any) => sum + tx.amount, 0);

    const totalIncome = monthTransactions
      .filter((tx: any) => tx.type === "credit")
      .reduce((sum: number, tx: any) => sum + tx.amount, 0);

    // Default income if none recorded
    const income = totalIncome > 0 ? totalIncome : 80000;
    const sharedSpent = monthTransactions
      .filter((tx: any) => tx.type === "debit" && tx.isShared)
      .reduce((sum: number, tx: any) => sum + tx.amount, 0);

    return {
      userId: user?.id || "user",
      userName: user?.name || "You",
      month: currentMonth,
      income,
      totalSpent,
      savings: income - totalSpent,
      savingsRate: calculateSavingsRate(income, totalSpent),
      sharedSpent,
      personalSpent: totalSpent - sharedSpent,
      savingsGoal: 20000
    };
  }, [user]);

  // Generate partner data (use real data if available, else mock)
  const partnerSummary = useMemo<MonthlySummary>(() => {
    const partnerName = partner?.name || settings.partnerName;
    // TODO: In future, fetch real partner transactions from API
    // For now, generate mock based on user's data with partner name
    return generateMockPartnerSummary(userSummary, partnerName);
  }, [userSummary, partner, settings.partnerName]);

  // Calculate comparison and points
  const comparison = useMemo(() => comparePartners(userSummary, partnerSummary), [userSummary, partnerSummary]);
  const currentPoints = useMemo(() => calculatePoints(userSummary, partnerSummary), [userSummary, partnerSummary]);

  // Load cumulative points
  const [cumulativePoints, setCumulativePoints] = useState<number>(() => {
    if (user?.id) {
      const stored = loadFairShareData(user.id);
      return stored.cumulativePoints + currentPoints.total;
    }
    return currentPoints.total;
  });

  // Calculate reward tier
  const currentTier = useMemo(() => getRewardTier(cumulativePoints, REWARD_TIERS), [cumulativePoints]);
  const tierProgress = useMemo(() => getNextTierProgress(cumulativePoints, REWARD_TIERS), [cumulativePoints]);

  // Access check
  React.useEffect(() => {
    if (user && familyType !== "couple" && familyType !== "joint") {
      setLocation("/home");
      toast({ title: "Access Denied", description: "This feature is for couples and families only", variant: "destructive" });
    }
  }, [user, familyType, setLocation, toast]);

  // Save settings when changed
  const handleSettingsChange = (key: keyof FairShareSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (user?.id) {
      const stored = loadFairShareData(user.id);
      saveFairShareData(user.id, { ...stored, settings: newSettings });
    }
    toast({ title: "Settings Updated" });
  };



  // Update settings when partner is loaded
  React.useEffect(() => {
    if (partner?.name && settings.partnerName !== partner.name) {
      handleSettingsChange("partnerName", partner.name);
    }
  }, [partner?.name, settings.partnerName]);

  const handleClaimReward = () => {
    toast({
      title: "🎉 Reward Claimed!",
      description: `You've unlocked: ${currentTier?.suggestedTrip}. Start planning your trip!`
    });
  };

  if (!user || (familyType !== "couple" && familyType !== "joint")) return null;

  return (
    <MobileShell>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="text-center space-y-1 relative mb-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
            <Heart className="w-4 h-4 text-pink-300 absolute top-0 left-1/4 animate-pulse" />
            <Heart className="w-6 h-6 text-red-300 absolute top-8 right-1/4 animate-bounce" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center justify-center gap-2">
            We <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          </h1>
          <p className="text-muted-foreground text-sm">{user?.name} & {settings.partnerName}'s Money Zone</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4 bg-pink-50/50">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white data-[state=active]:text-pink-600">
              <Home className="w-4 h-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-white data-[state=active]:text-pink-600">
              <BarChart3 className="w-4 h-4 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs data-[state=active]:bg-white data-[state=active]:text-pink-600">
              <Trophy className="w-4 h-4 mr-1" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-white data-[state=active]:text-pink-600">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            <CoupleComparisonCard comparison={comparison} />
            <FairnessScoreCard score={comparison.fairnessIndex} />

            {/* Trip Goal Card */}
            <div className="bg-white p-3 pb-6 rounded-sm shadow-xl rotate-1 mx-auto max-w-[280px] border border-gray-200">
              <div className="aspect-square bg-gray-100 mb-3 overflow-hidden rounded-sm">
                <img src={generatedPolaroid} className="w-full h-full object-cover" alt="Couple" />
              </div>
              <p className="text-center font-handwriting text-lg text-gray-600 font-bold">Italy Trip Dec 2026 🇮🇹</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-full w-[54%]" />
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-1">₹3.8L / ₹7L Saved</p>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-0">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Monthly Breakdown</h3>

              {/* You */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">You</span>
                  <span className="text-gray-500">{formatCurrencyShort(userSummary.totalSpent)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (userSummary.totalSpent / userSummary.income) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Shared: {formatCurrencyShort(userSummary.sharedSpent)}</span>
                  <span>Personal: {formatCurrencyShort(userSummary.personalSpent)}</span>
                </div>
              </div>

              {/* Partner */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{settings.partnerName}</span>
                  <span className="text-gray-500">{formatCurrencyShort(partnerSummary.totalSpent)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (partnerSummary.totalSpent / partnerSummary.income) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Shared: {formatCurrencyShort(partnerSummary.sharedSpent)}</span>
                  <span>Personal: {formatCurrencyShort(partnerSummary.personalSpent)}</span>
                </div>
              </div>
            </div>

            {/* Savings Comparison */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
              <h3 className="text-sm font-bold text-green-800 mb-3">Savings Rate</h3>
              <div className="flex gap-4">
                <div className="flex-1 text-center">
                  <p className="text-2xl font-black text-green-700">{Math.round(userSummary.savingsRate)}%</p>
                  <p className="text-xs text-green-600">You</p>
                </div>
                <div className="w-[1px] bg-green-200" />
                <div className="flex-1 text-center">
                  <p className="text-2xl font-black text-green-700">{Math.round(partnerSummary.savingsRate)}%</p>
                  <p className="text-xs text-green-600">{settings.partnerName}</p>
                </div>
              </div>
            </div>

            {/* Shaadi Gift Vault */}
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
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4 mt-0">
            <PointsCard
              currentPoints={currentPoints}
              cumulativePoints={cumulativePoints}
            />
            <RewardTierCard
              currentTier={currentTier}
              cumulativePoints={cumulativePoints}
              nextTier={tierProgress.nextTier}
              pointsToNextTier={tierProgress.pointsNeeded}
              progressPct={tierProgress.progressPct}
              onClaimReward={handleClaimReward}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-0">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-gray-700">FairShare Settings</h3>

              {/* Partner Name */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Partner's Name</Label>
                <input
                  type="text"
                  value={settings.partnerName}
                  onChange={(e) => handleSettingsChange("partnerName", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter partner's name"
                />
              </div>

              {/* Reward Policy */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-Award Rewards</Label>
                  <p className="text-[10px] text-gray-500">Automatically unlock rewards when eligible</p>
                </div>
                <Switch
                  checked={settings.rewardPolicy === "auto"}
                  onCheckedChange={(checked) =>
                    handleSettingsChange("rewardPolicy", checked ? "auto" : "mutual-approval")
                  }
                />
              </div>

              {/* Point Conversion */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Point Value (₹ per point)</Label>
                <Select
                  value={settings.pointConversionRate.toString()}
                  onValueChange={(v) => handleSettingsChange("pointConversionRate", parseInt(v))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">₹100 per point</SelectItem>
                    <SelectItem value="200">₹200 per point</SelectItem>
                    <SelectItem value="500">₹500 per point</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reward Recipient */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Reward Goes To</Label>
                <Select
                  value={settings.rewardRecipientRule}
                  onValueChange={(v) => handleSettingsChange("rewardRecipientRule", v)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Partners</SelectItem>
                    <SelectItem value="lower_spender">Lower Spender</SelectItem>
                    <SelectItem value="higher_saver">Higher Saver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
              <p className="text-xs text-purple-700">
                💡 <strong>Tip:</strong> Set mutual goals with your partner and earn points together.
                The more you save as a couple, the better trips you unlock!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileShell>
  );
}
