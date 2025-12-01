import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, refreshUser } = useUser();

  const [screen, setScreen] = useState(0);
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [familyType, setFamilyType] = useState<"mai_sirf" | "couple" | "joint" | null>(null);
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      toast({ title: "Invalid", description: "Enter email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user.id);
        localStorage.setItem("userId", data.user.id);
        await refreshUser(); // Update global context without redirecting
        setScreen(1); // Go to Name screen
      } else {
        const data = await res.json();
        toast({ title: "Signup Failed", description: data.error || "Try again", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async () => {
    if (!email || !password) {
      toast({ title: "Invalid", description: "Enter email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user.id);
        login(data.user); // Update global context immediately
        // Check if onboarding is complete? For now, assume signin means existing user -> Home
        navigate("/home");
      } else {
        toast({ title: "Signin Failed", description: "Invalid credentials", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
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
        await refreshUser(); // Update context with name
        setScreen(2);
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
        await refreshUser(); // Update context with familyType
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
        await refreshUser(); // Update context
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

  const handleLinkBank = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/link-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await refreshUser(); // Ensure final state is captured
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
        {/* Screen 0: Auth (Email/Password) */}
        {screen === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-900">🏦 BazaarBudget</h1>
              <p className="text-sm text-gray-600 mt-2">Your Family's Money Manager</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center gap-4 mb-6">
                <Button
                  variant={isSignup ? "default" : "ghost"}
                  onClick={() => setIsSignup(true)}
                  className={isSignup ? "bg-blue-600" : ""}
                >
                  Sign Up
                </Button>
                <Button
                  variant={!isSignup ? "default" : "ghost"}
                  onClick={() => setIsSignup(false)}
                  className={!isSignup ? "bg-blue-600" : ""}
                >
                  Sign In
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={isSignup ? handleSignup : handleSignin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
              >
                {loading ? "Processing..." : (isSignup ? "Create Account" : "Sign In")}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Screen 1: Name */}
        {screen === 1 && (
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

        {/* Screen 2: Family Type */}
        {screen === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Your Family Setup</h2>
              <p className="text-sm text-gray-600 mt-2">Choose what applies to you</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: "mai_sirf", label: "Mai Sirf (Single/Bachelor)", icon: "🧍", desc: "Just me managing my expenses" },
                { id: "couple", label: "Couple", icon: "👫", desc: "Me and my partner" },
                { id: "joint", label: "Joint Family", icon: "👨‍👩‍👧‍👦", desc: "Large family with shared expenses" },
              ].map((type) => (
                <div
                  key={type.id}
                  onClick={() => setFamilyType(type.id as any)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${familyType === type.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                    }`}
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
            <Button onClick={handleSaveFamily} disabled={!familyType || loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
              {loading ? "Saving..." : "Next"}
            </Button>
          </motion.div>
        )}

        {/* Screen 3: Income */}
        {screen === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Income Sources</h2>
              <p className="text-sm text-gray-600 mt-2">Where does money come from?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {incomeOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    if (incomeSources.includes(option.value)) {
                      setIncomeSources(incomeSources.filter((i) => i !== option.value));
                    } else {
                      setIncomeSources([...incomeSources, option.value]);
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer text-center text-sm font-medium transition-all ${incomeSources.includes(option.value) ? "bg-green-100 border-green-500 text-green-800" : "bg-gray-50 border-gray-200"
                    }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
            <Button onClick={handleSaveIncome} disabled={incomeSources.length === 0 || loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
              {loading ? "Saving..." : "Next"}
            </Button>
          </motion.div>
        )}

        {/* Screen 4: Bank Link */}
        {screen === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏦</span>
            </div>
            <h2 className="text-2xl font-bold">Link Bank Account?</h2>
            <p className="text-sm text-gray-600">We can auto-track expenses from SMS.</p>
            <div className="space-y-3">
              <Button onClick={handleLinkBank} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold">
                {loading ? "Linking..." : "Yes, Secure Link"}
              </Button>
              <Button variant="ghost" onClick={async () => {
                await refreshUser(); // Ensure final state is captured
                navigate("/home");
              }} className="w-full text-gray-500">
                Skip for now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
