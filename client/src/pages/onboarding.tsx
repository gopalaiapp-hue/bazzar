import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [screen, setScreen] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [familyType, setFamilyType] = useState<"single" | "couple" | "joint" | null>(null);
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid", description: "Enter valid phone", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "+91" + phone.replace(/\D/g, "").slice(-10) }),
      });
      if (res.ok) {
        toast({ title: "OTP Sent", description: "Check console for OTP (dev mode)" });
        setScreen(1);
      } else {
        toast({ title: "Failed", description: "Could not send OTP", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: "Invalid", description: "Enter 6-digit OTP", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "+91" + phone.replace(/\D/g, "").slice(-10), code: otp }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user.id);
        setScreen(2);
      } else {
        toast({ title: "Invalid OTP", description: "Try again", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name) {
      toast({ title: "Required", description: "Enter your name", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/step1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name }),
      });
      if (res.ok) {
        setScreen(3);
      } else {
        toast({ title: "Failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFamily = async () => {
    if (!familyType) {
      toast({ title: "Required", description: "Select family type", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/step2", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, familyType }),
      });
      if (res.ok) {
        setScreen(4);
      } else {
        toast({ title: "Failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIncome = async () => {
    if (incomeSources.length === 0) {
      toast({ title: "Required", description: "Select at least one income source", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/step3", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, incomeSources }),
      });
      if (res.ok) {
        setScreen(5);
      } else {
        toast({ title: "Failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkBank = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/link-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast({ title: "Success!", description: "Onboarding complete" });
        setTimeout(() => navigate("/home"), 500);
      } else {
        toast({ title: "Failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const incomeOptions = [
    { label: "Salary", value: "salary" },
    { label: "Freelance", value: "freelance" },
    { label: "Business", value: "business" },
    { label: "Rental Income", value: "rental" },
    { label: "Stocks / Mutual Funds", value: "stocks" },
    { label: "Agriculture", value: "agriculture" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Screen 0: Phone */}
        {screen === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-900">🏦 BazaarBudget</h1>
              <p className="text-sm text-gray-600 mt-2">Your Family's Money Manager</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">+91</span>
                  <Input placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength="10" />
                </div>
              </div>
              <Button onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Screen 1: OTP */}
        {screen === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Verify OTP</h2>
              <p className="text-sm text-gray-600 mt-2">Sent to +91{phone.slice(-10)}</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Enter 6-Digit Code</Label>
                <Input type="text" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.slice(0, 6))} maxLength="6" className="mt-2 text-center text-xl tracking-widest" />
              </div>
              <Button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <Button variant="outline" onClick={() => { setScreen(0); setPhone(""); setOtp(""); }} className="w-full">
                Back
              </Button>
            </div>
          </motion.div>
        )}

        {/* Screen 2: Name */}
        {screen === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Namaste! Aapka naam kya hai?</h2>
              <p className="text-sm text-gray-600 mt-2">What's your name?</p>
            </div>
            <div className="space-y-4">
              <Input placeholder="E.g., Rahul Kumar" value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={handleSaveName} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
                {loading ? "Saving..." : "Next"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Screen 3: Family Type */}
        {screen === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Your Family Setup</h2>
              <p className="text-sm text-gray-600 mt-2">Choose what applies to you</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: "👤", title: "Sirf main", value: "single" as const },
                { icon: "💑", title: "Main + spouse", value: "couple" as const, popular: true },
                { icon: "👨‍👩‍👧‍👦", title: "Full joint family", value: "joint" as const },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFamilyType(opt.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    familyType === opt.value ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div className="text-left">
                    <p className="font-bold">{opt.title}</p>
                    {opt.popular && <p className="text-xs text-orange-600 font-medium">Most Popular</p>}
                  </div>
                </button>
              ))}
            </div>
            <Button onClick={handleSaveFamily} disabled={loading || !familyType} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
              {loading ? "Saving..." : "Next"}
            </Button>
          </motion.div>
        )}

        {/* Screen 4: Income Sources */}
        {screen === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Income Sources</h2>
              <p className="text-sm text-gray-600 mt-2">Select all that apply</p>
            </div>
            <div className="space-y-3">
              {incomeOptions.map((opt) => (
                <label key={opt.value} className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: incomeSources.includes(opt.value) ? "#0284c7" : "#e5e7eb" }}>
                  <input
                    type="checkbox"
                    checked={incomeSources.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIncomeSources([...incomeSources, opt.value]);
                      } else {
                        setIncomeSources(incomeSources.filter((s) => s !== opt.value));
                      }
                    }}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <span className="ml-3 font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleSaveIncome} disabled={loading || incomeSources.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
              {loading ? "Saving..." : "Next"}
            </Button>
          </motion.div>
        )}

        {/* Screen 5: Bank Linking */}
        {screen === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold">🏦 Link Your Bank</h2>
              <p className="text-sm text-gray-600 mt-2">Sab kuch auto track karne ke liye</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-700">✅ Last 90 days transactions will be imported</p>
              <p className="text-sm text-gray-700 mt-2">✅ Auto-created Pockets: Salary, Rent, Freelance, Cash</p>
              <p className="text-xs text-blue-600 font-medium mt-3">Ready to go magic? 🪄</p>
            </div>
            <Button onClick={handleLinkBank} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
