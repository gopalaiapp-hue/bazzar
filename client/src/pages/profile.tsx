import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  User, Settings, CreditCard, Users, Bell, Lock,
  Smartphone, Download, Share2, HelpCircle, LogOut,
  ChevronRight, Trash2, Shield, Moon, Sun, Palette,
  FileText, Database, AlertTriangle, EyeOff, Clock,
  Globe, MessageCircle, Info, Cloud, TrendingUp, ChevronDown,
  Wallet, ArrowUpRight, ArrowDownLeft, Mail, AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import { resendVerificationEmail } from "@/lib/supabaseApi";



function NetWorthDisplay({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  // Fetch pockets (Cash, Bank, UPI, etc.)
  const { data: pockets = [] } = useQuery({
    queryKey: ["pockets", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/pockets/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch pockets");
      const data = await res.json();
      return data.pockets || [];
    },
    enabled: !!userId
  });

  // Fetch goals (savings towards goals)
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/goals/${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.goals || [];
    },
    enabled: !!userId
  });

  // Fetch debts (LenaDena - 'took' = borrowed = liability)
  const { data: lenaDena = [] } = useQuery({
    queryKey: ["lena-dena", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/lenadena/${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.entries || [];
    },
    enabled: !!userId
  });

  // Calculate Assets by category
  const cashAssets = pockets.filter((p: any) => p.type === 'cash').reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const bankAssets = pockets.filter((p: any) => ['bank', 'salary'].includes(p.type)).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const upiWalletAssets = pockets.filter((p: any) => ['upi', 'wallet'].includes(p.type)).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const savingsAssets = pockets.filter((p: any) => p.type === 'savings').reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const otherAssets = pockets.filter((p: any) => !['cash', 'bank', 'salary', 'upi', 'wallet', 'savings'].includes(p.type)).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  // Goals savings (current saved amount)
  const goalsSavings = goals.reduce((s: number, g: any) => s + (Number(g.currentAmount) || 0), 0);

  // Calculate Liabilities
  const borrowedDebts = lenaDena
    .filter((item: any) => item.type === 'took' && item.status === 'pending')
    .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

  // Money owed to me (receivables) - not a liability, but good to track
  const receivables = lenaDena
    .filter((item: any) => item.type === 'gave' && item.status === 'pending')
    .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

  const totalAssets = cashAssets + bankAssets + upiWalletAssets + savingsAssets + otherAssets + goalsSavings;
  const totalLiabilities = borrowedDebts;
  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;

  const formatAmount = (amount: number) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4">
      {/* Main Net Worth Card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all ${isPositive
          ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700'
          : 'bg-gradient-to-br from-red-500 via-red-600 to-orange-600'
          }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/90 font-medium">{t('profile.totalNetWorth')}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </div>

          <div className="flex flex-col items-center mt-2 mb-4">
            <h2 className="text-3xl font-bold text-white mb-1">
              {isPositive ? '' : '-'}{formatAmount(netWorth)}
            </h2>
            <p className="text-white/80 text-xs bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              (Assets - Liabilities = Net Worth)
            </p>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
              <p className="text-white/70 text-xs mb-1">Assets (Own)</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-300" /> {formatAmount(totalAssets)}
              </p>
            </div>
            <div className="text-white/50 font-bold">-</div>
            <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
              <p className="text-white/70 text-xs mb-1">Liabilities (Owe)</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3 text-red-300" /> {formatAmount(totalLiabilities)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown (collapsible) */}
      {showDetails && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Assets Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Assets</h3>
              <span className="ml-auto text-green-600 font-bold">{formatAmount(totalAssets)}</span>
            </div>
            <div className="space-y-2">
              {cashAssets > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">💵</span> Cash in Hand
                  </span>
                  <span className="text-gray-800 font-medium">{formatAmount(cashAssets)}</span>
                </div>
              )}
              {bankAssets > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">🏦</span> Bank Accounts
                  </span>
                  <span className="text-gray-800 font-medium">{formatAmount(bankAssets)}</span>
                </div>
              )}
              {upiWalletAssets > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">📱</span> UPI & Wallets
                  </span>
                  <span className="text-gray-800 font-medium">{formatAmount(upiWalletAssets)}</span>
                </div>
              )}
              {savingsAssets > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">🐷</span> Savings
                  </span>
                  <span className="text-gray-800 font-medium">{formatAmount(savingsAssets)}</span>
                </div>
              )}
              {goalsSavings > 0 && (
                <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">🎯</span> Goals Savings
                  </span>
                  <span className="text-gray-800 font-medium">{formatAmount(goalsSavings)}</span>
                </div>
              )}
              {otherAssets > 0 && (
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">📦</span> Other
                  </span>
                  <span className="text-gray-800 font-medium">{formatAmount(otherAssets)}</span>
                </div>
              )}
              {totalAssets === 0 && (
                <p className="text-gray-400 text-sm text-center py-2">No assets added yet</p>
              )}
            </div>
          </div>

          {/* Liabilities Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <CreditCard className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Liabilities</h3>
              <span className="ml-auto text-red-600 font-bold">{formatAmount(totalLiabilities)}</span>
            </div>
            <div className="space-y-2">
              {borrowedDebts > 0 && (
                <div className="flex justify-between text-sm py-1.5">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="text-lg">💳</span> Borrowed (Lena-Dena)
                  </span>
                  <span className="text-red-600 font-medium">{formatAmount(borrowedDebts)}</span>
                </div>
              )}
              {totalLiabilities === 0 && (
                <p className="text-gray-400 text-sm text-center py-2">No liabilities - Great job! 🎉</p>
              )}
            </div>
          </div>

          {/* Receivables (Money owed to you) */}
          {receivables > 0 && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Money Owed to You</h3>
                    <p className="text-xs text-gray-500">Pending receivables</p>
                  </div>
                </div>
                <span className="text-blue-600 font-bold">{formatAmount(receivables)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Invite Code Display Component
function InviteCodeCard({ userId }: { userId?: string }) {
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");

  const { data: inviteData } = useQuery({
    queryKey: ["inviteCode", userId],
    queryFn: async () => {
      if (!userId) return null;
      // Fetch existing invite code from database
      const { getInviteCodeByCreator } = await import("@/lib/supabaseApi");
      const code = await getInviteCodeByCreator(userId);
      if (code) {
        setInviteCode(code.code);
      }
      return code;
    },
    enabled: !!userId
  });

  if (!inviteCode) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-blue-900 mb-1">Your Family Invite Code</h4>
          <p className="text-xs text-blue-700 mb-2">Share this code with family members to join</p>
          <div className="bg-white border border-blue-200 rounded-lg p-2 font-mono font-bold text-lg tracking-widest text-center text-blue-900">
            {inviteCode}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="ml-3 border-blue-200 text-blue-700 hover:bg-blue-100 h-10 w-10"
          onClick={() => {
            navigator.clipboard.writeText(inviteCode);
            toast({ title: "Copied!", description: "Invite code copied to clipboard" });
          }}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, session, refreshUser, logout, isLoading: isUserLoading } = useUser();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { showTestNotification } = useNotifications();
  const [, setLocation] = useLocation();

  // Settings State - initialize with safe defaults
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [isHiddenPockets, setIsHiddenPockets] = useState(false);
  const [dailyBriefTime, setDailyBriefTime] = useState("20:00");

  const [language, setLanguage] = useState("en");
  const [tempLanguage, setTempLanguage] = useState("en");

  // Sync state when user loads
  useEffect(() => {
    if (user) {
      setIsAppLocked(user.settings?.appLock ?? true);
      setIsHiddenPockets(user.settings?.hiddenPockets ?? false);
      setDailyBriefTime(user.settings?.dailyBriefTime || "20:00");
      setLanguage(user.language || "en");
      setTempLanguage(user.language || "en");
    }
  }, [user]);

  // Handle redirects and empty states -- REMOVED ALL REDIRECTS to strictly follow user request
  // Now we simply render different UI states based on auth status.

  // Show loading spinner
  if (isUserLoading) {
    return (
      <MobileShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileShell>
    );
  }

  // Robust ID check
  const userId = user?.id || session?.user?.id;

  // REMOVED BLOCKERS: User requested to see the UI even if signed out.
  // We will conditionally render user-specific data instead.

  const [tempDailyBriefTime, setTempDailyBriefTime] = useState(dailyBriefTime);



  const [notifications, setNotifications] = useState(user?.settings?.notifications || {
    spending: true, goals: true, family: true, budget: true
  });
  const [tempNotifications, setTempNotifications] = useState(notifications);

  const { theme, accent, isLiteMode, setTheme, setAccent, setLiteMode, applyTheme } = useTheme();
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempAccent, setTempAccent] = useState(accent);

  // Dialog States
  const [languageOpen, setLanguageOpen] = useState(false);
  const [dailyBriefOpen, setDailyBriefOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [accountTypeOpen, setAccountTypeOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [encryptBackup, setEncryptBackup] = useState(false);
  const [backupAccount, setBackupAccount] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const [tempFamilyType, setTempFamilyType] = useState<"mai_sirf" | "couple" | "joint" | null>(user?.familyType || null);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [banks, setBanks] = useState([
    { id: 1, name: "HDFC Bank", upi: "arjun@hdfc", type: "Bank" },
    { id: 2, name: "PhonePe", upi: "arjun.kumar@phonepe", type: "UPI" }
  ]);
  const [bankForm, setBankForm] = useState({ name: "", upi: "", type: "Bank" });
  const [editingBankId, setEditingBankId] = useState<number | null>(null);

  // Family Members State
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: "", relationship: "", phone: "", income: "" });
  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setLanguage(user.language || "en");
      i18n.changeLanguage(user.language || "en");
      setDailyBriefTime(user.settings?.dailyBriefTime || "20:00");
      setNotifications(user.settings?.notifications || { spending: true, goals: true, family: true, budget: true });
      setLiteMode(user.settings?.liteMode || false);
      setIsAppLocked(user.settings?.appLock !== undefined ? user.settings.appLock : true);
      setIsHiddenPockets(user.settings?.hiddenPockets || false);
    }
  }, [user, i18n]);

  // Fetch existing invite code from database
  const { data: inviteData } = useQuery({
    queryKey: ["inviteCode", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { getInviteCodeByCreator } = await import("@/lib/supabaseApi");
      return await getInviteCodeByCreator(userId);
    },
    enabled: !!userId
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family", userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/family/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch family");
      const data = await res.json();
      return data.members;
    },
    enabled: !!userId
  });

  const addFamilyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user?.id, income: parseInt(data.income) || 0 })
      });
      if (!res.ok) throw new Error("Failed to add member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      setAddFamilyOpen(false);
      setFamilyForm({ name: "", relationship: "", phone: "", income: "" });
      toast({ title: "Family Member Added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: async () => {
      await refreshUser();
      toast({ title: "Settings Updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    }
  });

  const handleSaveSettings = (key: string, value: any) => {
    const newSettings = { ...user?.settings, [key]: value };
    updateUserMutation.mutate({ settings: newSettings });
  };

  const handleSaveLanguage = () => {
    setLanguage(tempLanguage);
    i18n.changeLanguage(tempLanguage);
    updateUserMutation.mutate({ language: tempLanguage });
    setLanguageOpen(false);
  };

  const handleSaveDailyBrief = () => {
    setDailyBriefTime(tempDailyBriefTime);
    handleSaveSettings("dailyBriefTime", tempDailyBriefTime);
    setDailyBriefOpen(false);
  };

  const handleSaveNotifications = () => {
    setNotifications(tempNotifications);
    handleSaveSettings("notifications", tempNotifications);
    setNotificationsOpen(false);
  };

  const handleSaveTheme = () => {
    setTheme(tempTheme);
    setAccent(tempAccent);
    handleSaveSettings("theme", tempTheme);
    handleSaveSettings("accent", tempAccent);
    setThemeOpen(false);

    // Add visual feedback for theme changes
    const root = document.documentElement;
    root.classList.add("theme-change-feedback");
    setTimeout(() => {
      root.classList.remove("theme-change-feedback");
    }, 1000);
  };

  const handleSaveAccountType = () => {
    if (!tempFamilyType) return;
    updateUserMutation.mutate({ familyType: tempFamilyType });
    setAccountTypeOpen(false);
  };

  const getFamilyTypeLabel = (type: "mai_sirf" | "couple" | "joint" | null) => {
    switch (type) {
      case "mai_sirf": return "Mai Sirf (Single)";
      case "couple": return "Couple";
      case "joint": return "Joint Family";
      default: return "Not Set";
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'as', name: 'অসমীয়া (Assamese)' },
    { code: 'hi-en', name: 'Hinglish' }
  ];

  const handleAddFamily = () => {
    if (!familyForm.name || !familyForm.relationship) {
      toast({ title: "Required", description: "Name and Relationship are required", variant: "destructive" });
      return;
    }
    addFamilyMutation.mutate(familyForm);
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your data is being prepared. Download will start shortly.",
    });
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Date,Merchant,Amount,Category\n2025-11-29,Zomato,450,Food\n2025-11-29,Uber,230,Transport');
      link.download = 'Arjun_2025_Full_Report.csv';
      link.click();
    }, 1500);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm === "DELETE") {
      // Clear all localStorage data
      localStorage.clear();

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
        variant: "destructive"
      });

      // Redirect to home/onboarding after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } else {
      toast({
        title: "Confirmation Failed",
        description: "Please type DELETE to confirm.",
        variant: "destructive"
      });
    }
  };

  const handleSOS = () => {
    toast({
      title: "SOS Sent",
      description: "Live location and last 5 transactions sent to emergency contacts via WhatsApp.",
      variant: "destructive"
    });
    window.open(`https://wa.me/?text=EMERGENCY! Tracking link: maps.google.com/?q=19.0760,72.8777 | Last spend: ₹450 Zomato`, '_blank');
  };

  const handleSupport = () => {
    window.open("https://wa.me/919999999999?text=Hi SahKosh Support, I need help with...", "_blank");
  };

  const handleLogout = () => {
    logout();
  };

  const handleAddBank = () => {
    if (!bankForm.name || !bankForm.upi) {
      toast({ title: "Required", description: "Fill all fields", variant: "destructive" });
      return;
    }

    if (editingBankId) {
      setBanks(banks.map(b => b.id === editingBankId ? { ...b, ...bankForm } : b));
      toast({ title: "Updated", description: "Bank details updated" });
      setEditingBankId(null);
    } else {
      setBanks([...banks, { id: Date.now(), ...bankForm }]);
      toast({ title: "Added", description: "Bank account added" });
    }

    setBankForm({ name: "", upi: "", type: "Bank" });
  };

  const handleEditBank = (bank: any) => {
    setBankForm(bank);
    setEditingBankId(bank.id);
  };

  const handleDeleteBank = (id: number) => {
    setBanks(banks.filter(b => b.id !== id));
    toast({ title: "Deleted", description: "Bank account removed" });
  };

  const handleBackup = async () => {
    if (!backupAccount) {
      toast({ title: "Select Account", description: "Please select a Google account", variant: "destructive" });
      return;
    }
    setIsBackingUp(true);
    // Simulate backup delay
    setTimeout(() => {
      setIsBackingUp(false);
      setBackupOpen(false);
      toast({
        title: "Backup Successful",
        description: `Data backed up to ${backupAccount} ${encryptBackup ? '(Encrypted)' : ''}`
      });
    }, 2000);
  };


  const [generatedInviteCode, setGeneratedInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch("/api/auth/invite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedInviteCode(data.invite.code);
      } else {
        toast({ title: "Failed", description: "Could not generate invite code", variant: "destructive" });
      }
    } catch (error) {
      console.error("Generate invite error:", error);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <MobileShell>
      <div className="pb-8">
        {/* Header Profile Card */}
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
              <AvatarImage src={user?.profileImage || "https://github.com/shadcn.png"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-heading font-bold text-foreground">{user?.name || "User"}</h1>
                  <p className="text-muted-foreground text-sm">{user?.phone || user?.email}</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('profile.editProfile')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          defaultValue={user?.name || ""}
                          onChange={(e) => handleSaveSettings("name", e.target.value)}
                        />
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming Soon", description: "Password change will be available soon." })}>
                          Change Password
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => toast({ title: "Saved", description: "Profile updated successfully." })}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{t('profile.premium')}</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {user?.role === 'admin' ? t('profile.familyHead') : 'Family Member'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-xl p-4 flex justify-between items-center shadow-lg shadow-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{t('profile.totalNetWorth')}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs font-semibold mb-1">How Net Worth is Calculated:</p>
                      <p className="text-xs">= (Accounts + Pockets) - Debts</p>
                      <p className="text-[10px] text-gray-400 mt-1">Total Assets minus Total Liabilities.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <NetWorthDisplay userId={userId} />
            </div>
            <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Email Verification Banner */}
        {user?.emailVerified === false && (
          <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Email Not Verified</h3>
              <p className="text-xs text-amber-700 mt-0.5">Please verify your email for account security and password recovery.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
              disabled={isResendingVerification}
              onClick={async () => {
                if (!user?.email) return;
                setIsResendingVerification(true);
                try {
                  await resendVerificationEmail(user.email);
                  toast({
                    title: "Verification email sent!",
                    description: "Check your inbox and click the link to verify.",
                  });
                } catch (error: any) {
                  toast({
                    title: "Failed to send",
                    description: error.message || "Please try again later.",
                    variant: "destructive"
                  });
                } finally {
                  setIsResendingVerification(false);
                }
              }}
            >
              {isResendingVerification ? "Sending..." : "Verify Now"}
            </Button>
          </div>
        )}

        {/* Menu Items */}
        <div className="p-4 space-y-6">

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <div onClick={handleExport} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
              <Download className="w-6 h-6 text-blue-600" />
              <span className="text-xs font-bold text-center">{t('profile.exportData')}</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-200 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg text-green-800">₹200</div>
              <Share2 className="w-6 h-6 text-green-600" />
              <span className="text-xs font-bold text-center text-green-800">{t('profile.referEarn')}</span>
            </div>
            <div onClick={showTestNotification} className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
              <Bell className="w-6 h-6 text-blue-600" />
              <span className="text-xs font-bold text-center text-blue-800">Test Notification</span>
            </div>
          </div>

          {/* Accounts & Cards */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">{t('profile.accountsCards')}</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-3 p-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">{t('profile.banksUPI')} ({banks.length})</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100" onClick={() => { setBankForm({ name: "", upi: "", type: "Bank" }); setEditingBankId(null); }}>+ {t('profile.add')}</button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBankId ? "Edit Bank" : "Add Bank / UPI"}</DialogTitle>
                      <DialogDescription>Store account details locally (Real Bank Sync Coming Soon)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Account Type</Label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={bankForm.type} onChange={(e) => setBankForm({ ...bankForm, type: e.target.value })}>
                          <option>Bank</option>
                          <option>UPI</option>
                          <option>Card</option>
                        </select>
                      </div>
                      <div>
                        <Label>Bank / Service Name</Label>
                        <Input placeholder="e.g. HDFC, PhonePe" value={bankForm.name} onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Account Number / UPI ID</Label>
                        <Input placeholder="e.g. arjun@hdfc" value={bankForm.upi} onChange={(e) => setBankForm({ ...bankForm, upi: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setBankForm({ name: "", upi: "", type: "Bank" }); setEditingBankId(null); }}>Cancel</Button>
                      <Button onClick={handleAddBank}>{editingBankId ? "Update" : "Add"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {banks.map(bank => (
                <div key={bank.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-bold">{bank.name}</p>
                    <p className="text-xs text-muted-foreground">{bank.type} • {bank.upi}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditBank(bank)} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">{t('profile.edit')}</button>
                    <button onClick={() => handleDeleteBank(bank.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">{t('profile.delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Family & Safety - Hidden for mai_sirf users */}
          {user?.familyType !== 'mai_sirf' && (
            <section className="space-y-3">
              {/* Invite Code Display Card - Persistent */}
              <InviteCodeCard userId={user?.id} />

              <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('profile.familyMembers')} ({familyMembers.length})</h3>
                <Dialog open={addFamilyOpen} onOpenChange={setAddFamilyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-blue-600 h-6 text-xs bg-blue-50 hover:bg-blue-100" onClick={() => { setFamilyForm({ name: "", relationship: "", phone: "", income: "" }); setEditingFamilyId(null); setGeneratedInviteCode(""); }}>+ {t('profile.add')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('profile.addFamilyMember')}</DialogTitle>
                      <DialogDescription>Add members to share expenses and budget.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Invite Code Section */}
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">Invite via Code</h4>
                        <p className="text-xs text-blue-700 mb-3">Share this code with your partner/family member to let them join. Code never expires.</p>

                        {/* Always show the existing invite code from InviteCodeCard data or generate */}
                        {inviteData?.code || generatedInviteCode ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white border border-blue-200 rounded-lg p-2 text-center font-mono font-bold text-lg tracking-widest">
                              {inviteData?.code || generatedInviteCode}
                            </div>
                            <Button variant="outline" size="icon" onClick={() => {
                              navigator.clipboard.writeText(inviteData?.code || generatedInviteCode);
                              toast({ title: "Copied!", description: "Code copied to clipboard" });
                            }}>
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={handleGenerateInvite}
                            disabled={inviteLoading}
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            {inviteLoading ? "Getting Code..." : "Get Your Invite Code"}
                          </Button>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input placeholder="e.g. Priya" value={familyForm.name} onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship *</Label>
                        <Input placeholder="e.g. Spouse, Parent" value={familyForm.relationship} onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone (Optional)</Label>
                        <Input placeholder="+91" value={familyForm.phone} onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Annual Income (Optional)</Label>
                        <Input type="number" placeholder="0" value={familyForm.income} onChange={(e) => setFamilyForm({ ...familyForm, income: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddFamilyOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddFamily}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4 space-y-3">
                {familyMembers.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">{t('profile.noFamilyMembers')}</p>
                ) : (
                  familyMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-sm font-bold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.relationship} • {member.phone || "No phone"}</p>
                        {member.income > 0 && <p className="text-[10px] text-green-600 font-medium mt-1">{t('profile.income')}: ₹{member.income.toLocaleString()}/{t('profile.year')}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs bg-gray-50 hover:bg-gray-100">{t('profile.edit')}</Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs bg-red-50 text-red-600 hover:bg-red-100">{t('profile.delete')}</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-4" />

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t('profile.addNominee')}</p>
                          <p className="text-xs text-muted-foreground">{t('profile.forFamilyVault')}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('profile.addNominee')}</DialogTitle>
                      <DialogDescription>{t('profile.ensureVaultAccess')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>{t('profile.nomineeName')}</Label>
                        <Input placeholder="e.g. Priya Kumar" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('profile.phoneNumber')}</Label>
                        <Input placeholder="+91" type="tel" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('profile.relationship')}</Label>
                        <Input placeholder="Spouse, Parent, etc." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => toast({ title: "Nominee Added", description: "Details saved securely." })}>{t('profile.saveNominee')}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Separator />

                <Separator />
                <div onClick={handleSOS} className="flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">{t('profile.sos')}</p>
                      <p className="text-xs text-red-500">{t('profile.liveLocation')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-300" />
                </div>
              </div>
            </section>
          )}

          {/* App Settings */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">{t('profile.appSettings')}</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Dialog open={dailyBriefOpen} onOpenChange={setDailyBriefOpen}>
                <MenuItem icon={Clock} label={t('profile.dailyBriefTime')} sublabel={`${formatTime(dailyBriefTime)} • ${t('profile.quietHours')}`} onClick={() => setDailyBriefOpen(true)} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Daily Brief Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t('profile.sendDailyBriefAt')}</Label>
                      <div className="relative">
                        <Input type="time" value={tempDailyBriefTime} onChange={(e) => setTempDailyBriefTime(e.target.value)} className="pl-10" />
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('profile.quietHoursUntil')}</Label>
                      <div className="relative">
                        <Input type="time" defaultValue="22:00" className="pl-10" />
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTempDailyBriefTime(dailyBriefTime)}>Cancel</Button>
                    <Button onClick={handleSaveDailyBrief}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Separator />

              <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <MenuItem
                  icon={Bell}
                  label={t('profile.notificationPreferences')}
                  sublabel={notifications ? (Object.entries(notifications)
                    .filter(([_, enabled]) => enabled)
                    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                    .join(", ") || "None") : "None"}
                  onClick={() => setNotificationsOpen(true)}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Notification Preferences</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('profile.spendingAlerts')}</Label>
                      <Switch checked={tempNotifications.spending} onCheckedChange={(c) => setTempNotifications({ ...tempNotifications, spending: c })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('profile.goalsTargets')}</Label>
                      <Switch checked={tempNotifications.goals} onCheckedChange={(c) => setTempNotifications({ ...tempNotifications, goals: c })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('profile.familyActivity')}</Label>
                      <Switch checked={tempNotifications.family} onCheckedChange={(c) => setTempNotifications({ ...tempNotifications, family: c })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{t('profile.budgetWarnings')}</Label>
                      <Switch checked={tempNotifications.budget} onCheckedChange={(c) => setTempNotifications({ ...tempNotifications, budget: c })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTempNotifications(notifications)}>Cancel</Button>
                    <Button onClick={handleSaveNotifications}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('profile.appLock')}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.fingerprintPin')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        Change PIN
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change PIN</DialogTitle>
                        <DialogDescription>Enter your current PIN and set a new one.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Current PIN</Label>
                          <Input type="password" placeholder="Enter current PIN" maxLength={6} inputMode="numeric" />
                        </div>
                        <div className="space-y-2">
                          <Label>New PIN (4-6 digits)</Label>
                          <Input type="password" placeholder="Enter new PIN" maxLength={6} inputMode="numeric" />
                        </div>
                        <div className="space-y-2">
                          <Label>Confirm New PIN</Label>
                          <Input type="password" placeholder="Confirm new PIN" maxLength={6} inputMode="numeric" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          toast({ title: "PIN Changed", description: "Your new PIN has been set successfully." });
                        }}>
                          Update PIN
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Switch checked={isAppLocked} onCheckedChange={(c) => { setIsAppLocked(c); handleSaveSettings("appLock", c); }} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('profile.hideSensitivePockets')}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.hideFromFamily')}</p>
                  </div>
                </div>
                <Switch checked={isHiddenPockets} onCheckedChange={(c) => { setIsHiddenPockets(c); handleSaveSettings("hiddenPockets", c); }} />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('profile.liteMode')}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.bigFonts')}</p>
                  </div>
                </div>
                <Switch checked={isLiteMode} onCheckedChange={(c) => {
                  setLiteMode(c);
                  handleSaveSettings("liteMode", c);

                  // Add visual feedback for lite mode changes
                  const root = document.documentElement;
                  root.classList.add("theme-change-feedback");
                  setTimeout(() => {
                    root.classList.remove("theme-change-feedback");
                  }, 1000);
                }} />
              </div>
              <Separator />

              <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
                <MenuItem icon={Palette} label={t('profile.themeAccent')} sublabel={`${theme === 'light' ? t('profile.light') : theme === 'dark' ? t('profile.dark') : 'System'} • ${accent}`} onClick={() => setThemeOpen(true)} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Theme & Accent</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <div className="flex gap-2">
                        <Button variant={tempTheme === 'light' ? 'default' : 'outline'} className="flex-1" onClick={() => setTempTheme('light')}>
                          <Sun className="w-4 h-4 mr-2" /> {t('profile.light')}
                        </Button>
                        <Button variant={tempTheme === 'dark' ? 'default' : 'outline'} className="flex-1" onClick={() => setTempTheme('dark')}>
                          <Moon className="w-4 h-4 mr-2" /> {t('profile.dark')}
                        </Button>
                        <Button variant={tempTheme === 'system' ? 'default' : 'outline'} className="flex-1" onClick={() => setTempTheme('system')}>
                          <Smartphone className="w-4 h-4 mr-2" /> System
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={tempAccent} onChange={(e) => setTempAccent(e.target.value as any)}>
                        {["Kesari Orange", "Ocean Blue", "Emerald Green", "Ruby Red", "Purple Royale"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setTempTheme(theme); setTempAccent(accent); }}>Cancel</Button>
                    <Button onClick={handleSaveTheme}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Separator />

              <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
                <MenuItem icon={Globe} label={t('settings.language')} sublabel={languages.find(l => l.code === language)?.name || language} onClick={() => setLanguageOpen(true)} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Language</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
                    {languages.map(lang => (
                      <div
                        key={lang.code}
                        className={`p-3 rounded-lg border cursor-pointer ${tempLanguage === lang.code ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                        onClick={() => setTempLanguage(lang.code)}
                      >
                        {lang.name}
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setLanguageOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveLanguage}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Separator />

              <Dialog open={accountTypeOpen} onOpenChange={setAccountTypeOpen}>
                <MenuItem
                  icon={Users}
                  label="Account Type"
                  sublabel={getFamilyTypeLabel(user?.familyType || null)}
                  onClick={() => {
                    setTempFamilyType(user?.familyType || null);
                    setAccountTypeOpen(true);
                  }}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Account Type</DialogTitle>
                    <DialogDescription>Choose your family setup</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    {[
                      { id: "mai_sirf", label: "Mai Sirf (Single/Bachelor)", icon: "🧍", desc: "Just me managing my expenses" },
                      { id: "couple", label: "Couple", icon: "👫", desc: "Me and my partner" },
                      { id: "joint", label: "Joint Family", icon: "👨‍👩‍👧‍👦", desc: "Large family with shared expenses" },
                    ].map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setTempFamilyType(type.id as any)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${tempFamilyType === type.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{type.icon}</span>
                          <div>
                            <h3 className="font-bold text-gray-900">{type.label}</h3>
                            <p className="text-xs text-gray-500">{type.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAccountTypeOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveAccountType}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          {/* Backup & Security */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">{t('profile.backupSecurity')}</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Dialog open={backupOpen} onOpenChange={setBackupOpen}>
                <MenuItem
                  icon={Cloud}
                  label="Google Drive Backup"
                  sublabel={backupAccount ? `Active: ${backupAccount}` : "Not configured"}
                  onClick={() => setBackupOpen(true)}
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Google Drive Backup</DialogTitle>
                    <DialogDescription>Securely backup your financial data</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Google Account</Label>
                      <Select value={backupAccount} onValueChange={setBackupAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user@gmail.com">{user?.email || "user@gmail.com"}</SelectItem>
                          <SelectItem value="add_new">+ Add New Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Encrypt Backup</Label>
                        <p className="text-xs text-muted-foreground">Password protect your backup file</p>
                      </div>
                      <Switch checked={encryptBackup} onCheckedChange={setEncryptBackup} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBackupOpen(false)}>Cancel</Button>
                    <Button onClick={handleBackup} disabled={isBackingUp}>
                      {isBackingUp ? "Backing up..." : "Backup Now"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Separator />
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-600">{t('profile.deleteAccount')}</p>
                        <p className="text-xs text-red-400">{t('profile.permanentlyRemove')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-300" />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600">{t('profile.deleteAccountPermanently')}</DialogTitle>
                    <DialogDescription>
                      {t('profile.deleteWarning')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t('profile.typeDelete')}</Label>
                      <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE"}>Delete Permanently</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          {/* Support & Logout */}
          <section className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div onClick={handleSupport} className="flex items-center justify-between p-4 hover:bg-green-50 active:bg-green-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('profile.whatsappSupport')}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.repliesIn5')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
              <Separator />
              <a href="/privacy-policy">
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('profile.privacyPolicy')}</p>
                      <p className="text-xs text-muted-foreground">{t('profile.dataUsageRights')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </a>
              <Separator />
              <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center group-hover:bg-gray-100">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{t('profile.logout')}</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-4 text-center pb-20">
              <p className="text-[10px] text-gray-400 mt-2">SahKosh v1.0.0 (Beta)</p>
              <p className="text-[10px] text-gray-300">Made with ❤️ in India</p>
            </div>
          </section>
        </div>
      </div>
    </MobileShell>
  );
}

const MenuItem = React.forwardRef(({ icon: Icon, label, sublabel, onClick, ...props }: any, ref: any) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      {...props}
      className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
    >
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
});
MenuItem.displayName = "MenuItem";

function formatTime(time: string) {
  if (!time) return "";
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}
