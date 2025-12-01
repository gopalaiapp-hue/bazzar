import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  User, Settings, CreditCard, Users, Bell, Lock,
  Smartphone, Download, Share2, HelpCircle, LogOut,
  ChevronRight, Trash2, Shield, Moon, Sun, Palette,
  FileText, Database, AlertTriangle, EyeOff, Clock,
  Globe, MessageCircle, Info
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";

export default function Profile() {
  const { user, refreshUser, logout } = useUser();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Settings State
  const [isLiteMode, setIsLiteMode] = useState(user?.settings?.liteMode || false);
  const [isAppLocked, setIsAppLocked] = useState(user?.settings?.appLock || true);
  const [isHiddenPockets, setIsHiddenPockets] = useState(user?.settings?.hiddenPockets || false);

  const [language, setLanguage] = useState(user?.language || "en");
  const [tempLanguage, setTempLanguage] = useState(language);

  const [dailyBriefTime, setDailyBriefTime] = useState(user?.settings?.dailyBriefTime || "20:00");
  const [tempDailyBriefTime, setTempDailyBriefTime] = useState(dailyBriefTime);

  const [notifications, setNotifications] = useState(user?.settings?.notifications || {
    spending: true, goals: true, family: true, budget: true
  });
  const [tempNotifications, setTempNotifications] = useState(notifications);

  const [theme, setTheme] = useState(user?.settings?.theme || "light");
  const [accent, setAccent] = useState(user?.settings?.accent || "Kesari Orange");
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempAccent, setTempAccent] = useState(accent);

  // Dialog States
  const [languageOpen, setLanguageOpen] = useState(false);
  const [dailyBriefOpen, setDailyBriefOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [accountTypeOpen, setAccountTypeOpen] = useState(false);

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
      setTheme(user.settings?.theme || "light");
      setAccent(user.settings?.accent || "Kesari Orange");
      setIsLiteMode(user.settings?.liteMode || false);
      setIsAppLocked(user.settings?.appLock !== undefined ? user.settings.appLock : true);
      setIsHiddenPockets(user.settings?.hiddenPockets || false);
    }
  }, [user, i18n]);

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["family", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/family/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch family");
      const data = await res.json();
      return data.members;
    },
    enabled: !!user?.id
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
    // In a real app, apply theme/accent here via CSS variables or context
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
    window.open("https://wa.me/919999999999?text=Hi BazaarBudget Support, I need help with...", "_blank");
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
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{t('profile.premium')}</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{t('profile.familyHead')}</span>
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
                      <p className="text-xs">= Total Assets - Total Liabilities</p>
                      <p className="text-[10px] text-gray-400 mt-1">Includes all bank accounts, pockets, investments minus any loans or debts.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <h2 className="text-2xl font-bold">₹ 52,84,310</h2>
            </div>
            <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

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
                      <DialogDescription>Link your bank account or UPI for payments</DialogDescription>
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
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('profile.familyMembers')} ({familyMembers.length})</h3>
                <Dialog open={addFamilyOpen} onOpenChange={setAddFamilyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-blue-600 h-6 text-xs bg-blue-50 hover:bg-blue-100" onClick={() => { setFamilyForm({ name: "", relationship: "", phone: "", income: "" }); setEditingFamilyId(null); }}>+ {t('profile.add')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('profile.addFamilyMember')}</DialogTitle>
                      <DialogDescription>Add members to share expenses and budget.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
                  <MenuItem icon={Globe} label="Language" sublabel={languages.find(l => l.code === language)?.name || language} onClick={() => setLanguageOpen(true)} />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Select Language</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setTempLanguage(lang.code)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${tempLanguage === lang.code
                            ? "border-primary bg-primary/10"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          <span className="text-sm font-medium">{lang.name}</span>
                          {tempLanguage === lang.code && (
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTempLanguage(language)}>Cancel</Button>
                      <Button onClick={handleSaveLanguage}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Separator />
                <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">{t('profile.logout')}</p>
                      <p className="text-xs text-red-500">{t('profile.signOut')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-300" />
                </div>
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
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('profile.appLock')}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.fingerprintPin')}</p>
                  </div>
                </div>
                <Switch checked={isAppLocked} onCheckedChange={(c) => { setIsAppLocked(c); handleSaveSettings("appLock", c); }} />
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
                <Switch checked={isLiteMode} onCheckedChange={(c) => { setIsLiteMode(c); handleSaveSettings("liteMode", c); }} />
              </div>
              <Separator />

              <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
                <MenuItem icon={Palette} label={t('profile.themeAccent')} sublabel={`${theme === 'light' ? t('profile.light') : t('profile.dark')} • ${accent}`} onClick={() => setThemeOpen(true)} />
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
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <select className="w-full px-3 py-2 border rounded-lg" value={tempAccent} onChange={(e) => setTempAccent(e.target.value)}>
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
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('profile.autoBackup')}</p>
                    <p className="text-xs text-muted-foreground">{t('profile.googleDriveWeekly')}</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
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
              <p className="text-[10px] text-gray-400 mt-2">BazaarBudget v1.0.0 (Beta)</p>
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
