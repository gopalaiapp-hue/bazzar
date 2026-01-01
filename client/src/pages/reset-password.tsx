import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";

export default function ResetPassword() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionReady, setSessionReady] = useState(false);

    // Check for recovery session from URL hash
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleRecovery = async () => {
            // Supabase puts recovery tokens in URL hash
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const type = hashParams.get('type');

            console.log("Reset password page loaded:", {
                type,
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                hash: window.location.hash.substring(0, 50) + "..."
            });

            // If we have an access token in the URL, set the session manually
            if (accessToken) {
                try {
                    // Set session with the tokens from URL
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || ''
                    });

                    if (error) {
                        console.error("Failed to set session:", error);
                        setError("Invalid or expired reset link. Please request a new one.");
                        return;
                    }

                    if (data.session) {
                        console.log("Session established from URL token");
                        setSessionReady(true);
                        // Clear the hash from URL for cleaner look
                        window.history.replaceState(null, '', window.location.pathname);
                        return;
                    }
                } catch (err) {
                    console.error("Error setting session:", err);
                }
            }

            // Fallback: Check if there's an existing session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log("Found existing session");
                setSessionReady(true);
            } else if (!accessToken) {
                // No token in URL and no existing session
                setError("Invalid reset link. Please request a new password reset from the sign-in page.");
            }
        };

        // Listen for auth state changes (recovery token processing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("Auth state changed:", event, !!session);
                if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                    if (session) {
                        setSessionReady(true);
                    }
                }
            }
        );

        // Small delay to allow Supabase to process URL hash
        timeoutId = setTimeout(() => {
            handleRecovery();
        }, 500);

        // Timeout fallback - if still loading after 10 seconds, show error
        const fallbackTimeout = setTimeout(() => {
            if (!sessionReady && !error) {
                console.warn("Timeout waiting for session");
                setError("Could not verify reset link. Please try again or request a new link.");
            }
        }, 10000);

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(fallbackTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return Math.min(strength, 4);
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast({ title: "Required", description: "Please fill in both password fields", variant: "destructive" });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" });
            return;
        }

        if (getPasswordStrength(newPassword) < 3) {
            toast({ title: "Weak Password", description: "Please use a stronger password", variant: "destructive" });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Refresh session to ensure we have a valid token before update
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                console.error("Session refresh failed:", sessionError);
                throw new Error("Session expired. Please click the reset link in your email again.");
            }

            console.log("Attempting password update...");

            // 2. Create a timeout promise (15 seconds)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out. Please check your connection and try again.")), 15000)
            );

            // 3. Race the update against the timeout
            const { error }: any = await Promise.race([
                supabase.auth.updateUser({ password: newPassword }),
                timeoutPromise
            ]);

            if (error) {
                throw error;
            }

            setSuccess(true);
            toast({
                title: "Password Reset Successful! 🎉",
                description: "You can now sign in with your new password"
            });

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/");
            }, 3000);

        } catch (error: any) {
            console.error("Password reset error:", error);
            setError(error.message || "Failed to reset password. Please try again.");
            toast({
                title: "Reset Failed",
                description: error.message || "Could not reset password",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg text-center"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="text-green-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-green-700">Password Reset Complete!</h2>
                    <p className="text-gray-600">Your password has been updated successfully.</p>
                    <p className="text-sm text-gray-500">Redirecting to sign in...</p>
                    <Button
                        onClick={() => navigate("/")}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
                    >
                        Go to Sign In
                    </Button>
                </motion.div>
            </div>
        );
    }

    // Error state (invalid link)
    if (error && !sessionReady) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg text-center"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="text-red-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-red-700">Link Expired or Invalid</h2>
                    <p className="text-gray-600">{error}</p>
                    <Button
                        onClick={() => navigate("/")}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
                    >
                        Back to Sign In
                    </Button>
                </motion.div>
            </div>
        );
    }

    // Loading state while checking token
    if (!sessionReady) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg text-center"
                >
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h2 className="text-xl font-bold">Verifying Reset Link...</h2>
                    <p className="text-gray-600">Please wait while we verify your password reset link.</p>
                </motion.div>
            </div>
        );
    }

    // Main reset form
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-6 bg-white rounded-2xl p-8 shadow-lg"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockKeyhole className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-blue-900">Reset Your Password</h1>
                    <p className="text-sm text-gray-600 mt-2">Enter your new password below</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">New Password</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
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

                    {newPassword.length > 0 && (
                        <div className="mt-2">
                            <PasswordStrengthMeter password={newPassword} />
                        </div>
                    )}

                    <div>
                        <Label className="text-sm font-medium">Confirm Password</Label>
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 mt-1 flex items-center">
                                <AlertCircle size={12} className="mr-1" /> Passwords do not match
                            </p>
                        )}
                        {confirmPassword && newPassword === confirmPassword && (
                            <p className="text-xs text-green-500 mt-1 flex items-center">
                                <CheckCircle size={12} className="mr-1" /> Passwords match
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleResetPassword}
                        disabled={loading || getPasswordStrength(newPassword) < 3 || newPassword !== confirmPassword}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="w-full text-gray-500"
                    >
                        Cancel
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
