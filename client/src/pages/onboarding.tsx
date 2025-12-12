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
import { supabase } from "@/lib/supabaseClient";
import { createUserProfile, updateUser, validateInviteCode as validateInviteCodeApi, createInviteCode, getInviteCodeByCreator, resetPasswordForEmail } from "@/lib/supabaseApi";

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

  // CRITICAL: Check if user is already logged in and onboarding complete
  // If so, redirect to home immediately
  React.useEffect(() => {
    const checkSession = async () => {
      // Check localStorage for onboarding completion (matches key set in handleLinkBank)
      const onboardingComplete = localStorage.getItem('onboarding_completed') === 'true';

      // If user exists in context and onboarding is complete, go to home
      if (user && user.id) {
        // Check if user has completed onboarding (step 99 or flag set)
        if (user.onboardingStep === 99 || onboardingComplete) {
          console.log("User already logged in, redirecting to home");
          navigate("/home");
          return;
        }
      }

      // Also check Supabase session directly
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && onboardingComplete) {
        console.log("Session found, redirecting to home");
        navigate("/home");
      }
    };

    checkSession();
  }, [user, navigate]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials on mount
  React.useEffect(() => {
    const remembered = localStorage.getItem('bazaar_remembered_email');
    const rememberedPw = localStorage.getItem('bazaar_remembered_pw');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
      // Auto-fill password if available (decoded from Base64)
      if (rememberedPw) {
        try {
          setPassword(atob(rememberedPw));
        } catch (e) {
          console.warn('Failed to decode remembered password');
        }
      }
    }
  }, []);

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
    setNetworkError(null); // Clear any previous errors

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: isMember ? name : undefined,
          },
          emailRedirectTo: 'https://bazaarbudget.app/auth/callback'
        }
      });

      if (authError) {
        // Check specifically for User already registered error
        if (authError.message.toLowerCase().includes('already') ||
          authError.message.toLowerCase().includes('registered') ||
          authError.message.toLowerCase().includes('duplicate')) {
          throw new Error('EMAIL_ALREADY_REGISTERED');
        }
        throw authError;
      }
      if (!authData.user) throw new Error("Signup failed - no user returned");

      const newUserId = authData.user.id;
      setUserId(newUserId);

      // Check if we got a session (auto-confirmation) or not (email confirmation required)
      const { data: { session } } = await supabase.auth.getSession();
      const hasSession = !!session || !!authData.session;

      console.log("Signup result:", { userId: newUserId, hasSession, sessionExists: !!authData.session });

      // Handle member signup with invite code
      if (isMember && inviteValid) {
        await updateUser(newUserId, {
          name,
          role: 'member',
          onboarding_step: 99,
          onboarding_complete: true,
        });
      }

      // Only refresh user if we have a session
      if (hasSession) {
        await refreshUser();
      } else {
        // For session-less signup (email confirmation required)
        // Create basic profile that will be completed after email verification
        updateUser(newUserId, {
          email,
          name: isMember ? name : null,
          onboarding_step: 0,
        }).catch(err => {
          console.warn("Profile creation will be handled by database trigger:", err);
        });

        // Show friendly message that email verification is needed
        toast({
          title: "Welcome! Check your email 📧",
          description: "We've sent a verification link. Click it to activate your account and signin.",
          duration: 8000
        });
      }

      // Save email if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('bazaar_remembered_email', email);
      } else {
        localStorage.removeItem('bazaar_remembered_email');
      }

      if (isMember) {
        navigate("/home");
      } else {
        setScreen(1); // Go to Name screen for Admin
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = error.message || "Signup failed";
      // Check for various duplicate email error patterns
      const isDuplicateEmail = errorMessage.includes("already") ||
        errorMessage.includes("User already registered") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already been registered");

      if (isDuplicateEmail) {
        // Show confirmation dialog for duplicate signup
        const userChoice = window.confirm(
          `This email (${email}) is already registered.\n\nWould you like to sign in instead?\n\n` +
          `Click OK to go to Sign In, or Cancel to try a different email.`
        );

        if (userChoice) {
          // User wants to sign in - switch to signin mode and prefill email
          setIsSignup(false);
          toast({
            title: "Redirected to Sign In",
            description: "Please enter your password to continue"
          });
        }
      } else {
        toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const validateInviteCode = async () => {
    if (!inviteCode || inviteCode.length < 8) return;

    try {
      const invite = await validateInviteCodeApi(inviteCode);
      if (invite) {
        setInviteValid(true);
        setAdminName((invite as any).creator?.name || 'Admin');
        toast({ title: "Valid Code", description: `Invited by ${(invite as any).creator?.name || 'Admin'}`, className: "bg-green-50 border-green-200" });
      }
    } catch (error: any) {
      setInviteValid(false);
      setAdminName("");
      toast({ title: "Invalid Code", description: "Please check your invite code", variant: "destructive" });
    }
  };

  const handleSignin = async () => {
    if (!email || !password) {
      toast({ title: "Invalid", description: "Enter email and password", variant: "destructive" });
      return;
    }

    setLoading(true);
    setNetworkError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        setLoading(false);
        // Handle specific error cases
        if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
          throw new Error("Please verify your email first. Check your inbox for the verification link.");
        }
        if (error.message.includes("Invalid") || error.message.includes("credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        throw error;
      }

      if (!data.user || !data.session) {
        setLoading(false);
        throw new Error("Signin failed - no session returned");
      }

      // Save or clear remembered credentials based on checkbox
      if (rememberMe) {
        localStorage.setItem('bazaar_remembered_email', email);
        localStorage.setItem('bazaar_remembered_pw', btoa(password));
      } else {
        localStorage.removeItem('bazaar_remembered_email');
        localStorage.removeItem('bazaar_remembered_pw');
      }

      setUserId(data.user.id);
      await refreshUser(); // Load user profile into context
      setLoading(false);
      navigate("/home");
    } catch (error: any) {
      setLoading(false);
      console.error("Signin error:", error);

      const errorMessage = error.message || "Invalid credentials";
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        setNetworkError("Network error. Please check your internet connection and try again.");
      } else {
        toast({
          title: "Signin Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const handleSaveName = async () => {
    if (!name) {
      toast({ title: "Required", description: "Enter your name", variant: "destructive" });
      return;
    }

    if (name.length < 2) {
      toast({ title: "Invalid Name", description: "Name should be at least 2 characters", variant: "destructive" });
      return;
    }

    // Validate name: only alphabets and spaces allowed
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      toast({
        title: "Invalid Name",
        description: "Name can only contain letters and spaces. Numbers and special characters are not allowed.",
        variant: "destructive"
      });
      return;
    }

    // Just proceed to next screen - database will be updated after verification
    console.log("Saving name locally:", name);
    setScreen(2);
  };

  const handleSaveFamily = async () => {
    if (!familyType) {
      toast({ title: "Required", description: "Select family type", variant: "destructive" });
      return;
    }

    // Just proceed to next screen - database will be updated after verification
    console.log("Saving family type locally:", familyType);
    setScreen(3);
  };

  const handleSaveIncome = async () => {
    if (incomeSources.length === 0) {
      toast({ title: "Required", description: "Select at least one income source", variant: "destructive" });
      return;
    }

    // Just proceed to next screen - database will be updated after verification
    console.log("Saving income sources locally:", incomeSources);
    setScreen(4);
  };

  const handleSaveFamilyType = async () => {
    setLoading(true);
    try {
      // Mark onboarding as complete in both database and localStorage
      await updateUser(userId, {
        onboarding_step: 99,
        onboarding_complete: true,
        name,
        family_type: familyType  // Use snake_case for database column
      });

      // Store completion flag in localStorage as well
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('user_id', userId);

      await refreshUser();
      toast({ title: "Success!", description: "Onboarding complete" });
      setTimeout(() => navigate("/home"), 500);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [generatedInviteCode, setGeneratedInviteCode] = useState("");

  const handleGenerateInvite = async () => {
    try {
      // Generate code
      const code = `FAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
      setGeneratedInviteCode(code);

      // Save to database immediately
      await createInviteCode({
        code,
        creator_id: userId,
        family_name: name || 'Family',
        status: 'active',
        auto_accept: false
      });

      toast({ title: "Invite Code Generated", description: "Share this code with your family" });
      console.log("Invite code saved to database:", code);
    } catch (error) {
      console.error("Failed to create invite code:", error);
      toast({ title: "Error", description: "Could not generate invite code", variant: "destructive" });
    }
  };

  const handleLinkBank = async () => {
    // Show coming soon message
    toast({
      title: "Coming Soon! 🚀",
      description: "Bank linking feature will be available soon. Stay tuned!",
      duration: 3000
    });

    // Wait a moment for user to see the toast, then proceed
    setTimeout(async () => {
      if (familyType === 'couple' || familyType === 'joint') {
        await handleGenerateInvite();
        setScreen(5);
      } else {
        // Save final data and navigate to home
        await handleSaveFamilyType();
      }
    }, 1500);
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
                      await resetPasswordForEmail(forgotPasswordEmail);

                      setForgotPasswordSuccess(true);
                      toast({ title: "Success", description: "Password reset link sent to your email" });

                    } catch (error) {
                      console.error("Forgot password error:", error);
                      let errorMessage = "Failed to send reset link";
                      if (error instanceof Error) {
                        errorMessage = error.message.includes("Failed to fetch") ? "Network error - please check your connection" : error.message;
                      }
                      console.error("Reset error:", error);

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

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2 mt-3">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="text-sm text-gray-700 cursor-pointer">
                  Remember my email
                </label>
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
              <Button onClick={handleLinkBank} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold">
                {loading ? "Linking..." : "Yes, Secure Link"}
              </Button>
              <Button variant="ghost" onClick={() => {
                // Skip bank linking and proceed
                if (familyType === 'couple' || familyType === 'joint') {
                  handleGenerateInvite();
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

