import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { Eye, EyeOff, LockKeyhole, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, login, refreshUser } = useUser();



  const safeSetStorage = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage access denied:", e);
    }
  };

  const [screen, setScreen] = useState(0);
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteValid, setInviteValid] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [familyType, setFamilyType] = useState<"mai_sirf" | "couple" | "joint" | null>(null);
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");

  // Sync userId from context if available
  React.useEffect(() => {
    if (user?.id && !userId) {
      setUserId(user.id);
    }
  }, [user, userId]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Helper function for password strength
  const getPasswordStrength = (password: string) => {
    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return Math.min(strength, 4);
  };

  const handleSignup = async () => {
    if (!email || !password) {
      toast({ title: "Invalid", description: "Enter email and password", variant: "destructive" });
      return;
    }

    if (isMember && !inviteCode) {
      toast({ title: "Invalid", description: "Enter invite code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const endpoint = isMember ? "/api/auth/member/signup" : "/api/auth/signup";
      const body = isMember
        ? { email, password, name, inviteCode }
        : { email, password };

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setUserId(data.user.id);
        safeSetStorage("userId", data.user.id);
        await refreshUser(); // Update global context without redirecting

        if (isMember) {
          // Members skip onboarding steps 2-4 usually, but let's see
          // For now, let's just go to home or maybe step 1 (name) if not provided?
          // Actually name is provided for member signup
          navigate("/home");
        } else {
          setScreen(1); // Go to Name screen for Admin
        }
      } else {
        const data = await res.json();
        let errorMessage = data.error || "Signup failed";
        if (data.error && data.error.includes("already registered")) {
          errorMessage = "Email already registered. Please sign in instead.";
        }
        toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      }
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Network error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error - please check your internet connection";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out - please try again";
        } else {
          errorMessage = "An unexpected error occurred";
        }
      }
      toast({ title: "Network Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const validateInviteCode = async () => {
    if (!inviteCode || inviteCode.length < 8) return;

    try {
      const res = await fetch(apiUrl("/api/auth/invite/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteValid(true);
        setAdminName(data.adminName);
        toast({ title: "Valid Code", description: `Invited by ${data.adminName}`, className: "bg-green-50 border-green-200" });
      } else {
        setInviteValid(false);
        setAdminName("");
        toast({ title: "Invalid Code", description: "Please check your invite code", variant: "destructive" });
      }
    } catch (error) {
      console.error("Validation error", error);
    }
  };

  const handleSignin = async () => {
    if (!email || !password) {
      toast({ title: "Invalid", description: "Enter email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/signin"), {
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
        const data = await res.json();
        let errorMessage = data.error || "Invalid credentials";
        if (errorMessage.includes("Invalid credentials")) {
          errorMessage = "Email or password is incorrect";
        }
        toast({ title: "Signin Failed", description: errorMessage, variant: "destructive" });
      }
    } catch (error) {
      console.error("Signin error:", error);
      let errorMessage = "Network error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error - please check your internet connection";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out - please try again";
        } else {
          errorMessage = "An unexpected error occurred";
        }
      }
      toast({ title: "Network Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name) {
      toast({ title: "Required", description: "Enter your name", variant: "destructive" });
      return;
    }

    // Validate name length
    if (name.length < 2) {
      toast({ title: "Invalid Name", description: "Name should be at least 2 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/onboarding/step1"), {
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
      const res = await fetch(apiUrl("/api/onboarding/step2"), {
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
      const res = await fetch(apiUrl("/api/onboarding/step3"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, incomeSources }),
      });
      if (res.ok) {
        await refreshUser(); // Update context
        setScreen(4);
      } else {
        const data = await res.json();
        toast({ title: "Failed", description: data.error || "Failed to save name", variant: "destructive" });
      }
    } catch (error) {
      console.error("Save name error:", error);
      let errorMessage = "Network error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error - please check your connection";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out - please try again";
        }
      }
      setNetworkError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFamilyType = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/onboarding/link-bank"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await refreshUser(); // Ensure final state is captured
        toast({ title: "Success!", description: "Onboarding complete" });
        setTimeout(() => navigate("/home"), 500);
      } else {
        const data = await res.json();
        toast({ title: "Failed", description: data.error || "Failed to save family type", variant: "destructive" });
      }
    } catch (error) {
      console.error("Save family error:", error);
      let errorMessage = "Network error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error - please check your connection";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out - please try again";
        }
      }
      setNetworkError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [generatedInviteCode, setGeneratedInviteCode] = useState("");

  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/invite/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
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
      setLoading(false);
    }
  };

  const handleLinkBank = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/onboarding/link-bank"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        await refreshUser(); // Ensure final state is captured

        // If Couple or Joint, go to Invite Screen
        if (familyType === 'couple' || familyType === 'joint') {
          await handleGenerateInvite();
          setScreen(5);
        } else {
          toast({ title: "Success!", description: "Onboarding complete" });
          setTimeout(() => navigate("/home"), 500);
        }
      } else {
        const data = await res.json();
        toast({ title: "Failed", description: data.error || "Failed to save family type", variant: "destructive" });
      }
    } catch (error) {
      console.error("Save family error:", error);
      let errorMessage = "Network error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error - please check your connection";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out - please try again";
        }
      }
      setNetworkError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
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
        {/* Forgot Password Screen */}
        {forgotPasswordMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-900">🔒 Forgot Password</h1>
              <p className="text-sm text-gray-600 mt-2">Enter your email to reset your password</p>
            </div>

            {forgotPasswordSuccess ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <LockKeyhole className="text-green-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-green-700">Password reset link sent!</h3>
                <p className="text-sm text-gray-600">Check your email for instructions to reset your password.</p>
                <Button
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setForgotPasswordSuccess(false);
                    setForgotPasswordEmail("");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!forgotPasswordEmail) {
                      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
                      return;
                    }

                    setForgotPasswordLoading(true);
                    try {
                      // Simulate API call for password reset
                      // In a real app, this would call /api/auth/forgot-password
                      console.log("Sending password reset request for:", forgotPasswordEmail);

                      // Call real API endpoint
                      const res = await fetch("/api/auth/forgot-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: forgotPasswordEmail }),
                      });

                      if (res.ok) {
                        setForgotPasswordSuccess(true);
                        toast({ title: "Success", description: "Password reset link sent to your email" });
                      } else {
                        const data = await res.json();
                        throw new Error(data.error || "Failed to send reset link");
                      }
                    } catch (error) {
                      console.error("Forgot password error:", error);
                      let errorMessage = "Failed to send reset link";
                      if (error instanceof Error) {
                        errorMessage = error.message.includes("Failed to fetch") ? "Network error - please check your connection" : error.message;
                      }
                      toast({ title: "Error", description: errorMessage, variant: "destructive" });
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading || !forgotPasswordEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
                >
                  {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setForgotPasswordEmail("");
                  }}
                  className="w-full text-gray-500"
                >
                  Cancel
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Screen 0: Auth (Email/Password) */}
        {!forgotPasswordMode && screen === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-900">🏦 SahKosh</h1>
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

              {/* Role Selection for Signup */}
              {isSignup && (
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                  <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isMember ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setIsMember(false)}
                  >
                    Head of Family
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isMember ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setIsMember(true)}
                  >
                    Family Member
                  </button>
                </div>
              )}

              {/* Member Invite Code Input */}
              {isSignup && isMember && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                  <Label className="text-sm font-medium text-blue-900">Invite Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="E.g. FAM-XXXX-XX"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="uppercase tracking-widest font-mono"
                      maxLength={15}
                    />
                    <Button
                      variant="outline"
                      onClick={validateInviteCode}
                      disabled={inviteCode.length < 8}
                      className="shrink-0"
                    >
                      Verify
                    </Button>
                  </div>
                  {inviteValid && (
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                      ✓ Invited by {adminName}
                    </p>
                  )}
                </div>
              )}

              {/* Name Input for Member Signup (since they skip onboarding) */}
              {isSignup && isMember && (
                <div>
                  <Label className="text-sm font-medium">Your Name</Label>
                  <Input
                    placeholder="E.g. Rahul"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Meter for Signup */}
              {isSignup && password.length > 0 && (
                <div className="mt-4">
                  <PasswordStrengthMeter password={password} />
                </div>
              )}

              {/* Forgot Password Link */}
              {!isSignup && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <Button
                onClick={isSignup ? handleSignup : handleSignin}
                disabled={loading || (isSignup && password.length > 0 && getPasswordStrength(password) < 3)}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
              >
                {loading ? "Processing..." : (isSignup ? "Create Account" : "Sign In")}
              </Button>

              {/* Network error banner */}
              {networkError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  <span>{networkError}</span>
                  <button
                    onClick={() => setNetworkError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Password requirements hint for Signup */}
              {isSignup && (
                <div className="text-xs text-gray-500 text-center">
                  {password.length === 0 && "Password must meet strength requirements"}
                  {password.length > 0 && getPasswordStrength(password) < 3 && (
                    <div className="flex items-center justify-center text-red-500">
                      <AlertCircle size={14} className="mr-1" />
                      Password needs to be stronger
                    </div>
                  )}
                </div>
              )}
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
              <Button onClick={handleSaveFamilyType} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold">
                {loading ? "Linking..." : "Yes, Secure Link"}
              </Button>
              <Button variant="ghost" onClick={async () => {
                await refreshUser(); // Ensure final state is captured
                if (familyType === 'couple' || familyType === 'joint') {
                  await handleGenerateInvite();
                  setScreen(5);
                } else {
                  navigate("/home");
                }
              }} className="w-full text-gray-500">
                Skip for now
              </Button>
            </div>
          </motion.div>
        )}

        {/* Screen 5: Invite Partner/Family */}
        {screen === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💌</span>
            </div>
            <h2 className="text-2xl font-bold">Invite your {familyType === 'couple' ? 'Partner' : 'Family'}</h2>
            <p className="text-sm text-gray-600">Share this code to link accounts.</p>

            <div className="bg-gray-100 p-4 rounded-xl border border-dashed border-gray-300 my-4">
              {loading ? (
                <p className="text-sm text-gray-500">Generating code...</p>
              ) : (
                <>
                  <p className="text-3xl font-mono font-bold tracking-widest text-blue-800">{generatedInviteCode}</p>
                  <p className="text-xs text-gray-500 mt-2">Valid for 7 days</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedInviteCode);
                  toast({ title: "Copied!", description: "Invite code copied to clipboard" });
                }}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Copy Code
              </Button>

              <Button onClick={() => navigate("/home")} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold">
                Done, Go to Home
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

