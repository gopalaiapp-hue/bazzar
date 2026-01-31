import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Lock, Eye, EyeOff, Check, AlertCircle, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChangePasswordSheetProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
}

export function ChangePasswordSheet({
    isOpen,
    onClose,
    userEmail,
}: ChangePasswordSheetProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    // Step state: 1 = verify current, 2 = set new password
    const [step, setStep] = useState(1);

    // Form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Visibility toggles
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Loading and error states
    const [isVerifying, setIsVerifying] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState("");

    // Password strength calculation
    const calculatePasswordStrength = (password: string): { strength: number; label: string; color: string } => {
        if (!password) return { strength: 0, label: "", color: "" };

        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 15;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

        if (strength < 40) return { strength, label: "Weak", color: "text-red-600" };
        if (strength < 70) return { strength, label: "Fair", color: "text-yellow-600" };
        if (strength < 90) return { strength, label: "Good", color: "text-blue-600" };
        return { strength, label: "Strong", color: "text-green-600" };
    };

    const passwordStrength = calculatePasswordStrength(newPassword);

    // Step 1: Verify current password
    const handleVerifyCurrentPassword = async () => {
        if (!currentPassword) {
            setError("Please enter your current password");
            return;
        }

        setIsVerifying(true);
        setError("");

        try {
            // Attempt to sign in with current credentials to verify password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: currentPassword,
            });

            if (signInError) {
                setError(t('profile.incorrectPassword', 'Current password is incorrect'));
                setIsVerifying(false);
                return;
            }

            // Password verified, move to step 2
            setStep(2);
            setError("");
        } catch (err) {
            console.error("Password verification error:", err);
            setError("Failed to verify password. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    // Step 2: Update to new password
    const handleUpdatePassword = async () => {
        setError("");

        // Validation
        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (newPassword.length < 8) {
            setError(t('profile.passwordRequirements', 'Password must be at least 8 characters'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('profile.passwordMismatch', 'Passwords do not match'));
            return;
        }

        if (newPassword === currentPassword) {
            setError("New password must be different from current password");
            return;
        }

        setIsUpdating(true);

        try {
            // Update password using Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) {
                console.error("Password update error:", updateError);
                setError(updateError.message || "Failed to update password");
                setIsUpdating(false);
                return;
            }

            // Success!
            toast({
                title: t('profile.passwordUpdated', 'Password updated successfully'),
                description: "Your password has been changed securely.",
            });

            // Reset and close
            handleClose();
        } catch (err) {
            console.error("Password update error:", err);
            setError("An unexpected error occurred. Please try again.");
            setIsUpdating(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        onClose();
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <SheetTitle className="text-lg font-bold">
                                {t('profile.changePassword', 'Change Password')}
                            </SheetTitle>
                            <p className="text-sm text-muted-foreground">
                                {step === 1 ? "Verify your identity" : "Set a new password"}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "flex-1 h-1.5 rounded-full transition-colors",
                            step >= 1 ? "bg-blue-600" : "bg-gray-200"
                        )} />
                        <div className={cn(
                            "flex-1 h-1.5 rounded-full transition-colors",
                            step >= 2 ? "bg-blue-600" : "bg-gray-200"
                        )} />
                    </div>

                    {/* Step 1: Current Password Verification */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-blue-800">
                                    🔒 {t('profile.enterCurrentPassword', 'Enter your current password to continue')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="current-password" className="text-sm font-medium">
                                    {t('profile.currentPassword', 'Current Password')} *
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="current-password"
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleVerifyCurrentPassword()}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: New Password Setup */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                <p className="text-sm text-green-800 flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    Current password verified
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-blue-800">
                                    💪 {t('profile.chooseStrongPassword', 'Choose a strong new password')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password" className="text-sm font-medium">
                                    {t('profile.newPassword', 'New Password')} *
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="new-password"
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {newPassword && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Password strength:</span>
                                            <span className={cn("font-medium", passwordStrength.color)}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={cn(
                                                    "h-1.5 rounded-full transition-all",
                                                    passwordStrength.strength < 40 && "bg-red-500",
                                                    passwordStrength.strength >= 40 && passwordStrength.strength < 70 && "bg-yellow-500",
                                                    passwordStrength.strength >= 70 && passwordStrength.strength < 90 && "bg-blue-500",
                                                    passwordStrength.strength >= 90 && "bg-green-500"
                                                )}
                                                style={{ width: `${passwordStrength.strength}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {t('profile.passwordRequirements', 'Password must be at least 8 characters')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-sm font-medium">
                                    {t('profile.confirmPassword', 'Confirm New Password')} *
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="confirm-password"
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Passwords do not match
                                    </p>
                                )}
                                {confirmPassword && newPassword === confirmPassword && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Passwords match
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-sm text-red-800 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 pb-2 space-y-2">
                    {step === 1 && (
                        <>
                            <Button
                                onClick={handleVerifyCurrentPassword}
                                disabled={!currentPassword || isVerifying}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isVerifying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        {t('profile.verifyingPassword', 'Verifying...')}
                                    </>
                                ) : (
                                    "Continue"
                                )}
                            </Button>
                            <Button variant="ghost" onClick={handleClose} className="w-full">
                                Cancel
                            </Button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Button
                                onClick={handleUpdatePassword}
                                disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || isUpdating}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        {t('profile.updatingPassword', 'Updating password...')}
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep(1);
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setError("");
                                }}
                                disabled={isUpdating}
                                className="w-full"
                            >
                                Back
                            </Button>
                            <Button variant="ghost" onClick={handleClose} disabled={isUpdating} className="w-full">
                                Cancel
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
