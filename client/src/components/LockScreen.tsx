import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { Shield, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const LOCK_PIN_KEY = "sahkosh_app_pin";
const UNLOCK_SESSION_KEY = "sahkosh_unlocked";

interface LockScreenProps {
    children: React.ReactNode;
}

export function LockScreen({ children }: LockScreenProps) {
    const { user, isLoading } = useUser();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [isLocked, setIsLocked] = useState(false);
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isSettingPin, setIsSettingPin] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Check if app lock is enabled and if there's a stored PIN
    useEffect(() => {
        if (isLoading || !user) return;

        const appLockEnabled = user.settings?.appLock !== false; // default true
        const storedPin = localStorage.getItem(LOCK_PIN_KEY);
        const sessionUnlocked = sessionStorage.getItem(UNLOCK_SESSION_KEY);

        if (appLockEnabled) {
            if (!storedPin) {
                // No PIN set yet, prompt to set one
                setIsSettingPin(true);
                setIsLocked(true);
            } else if (!sessionUnlocked) {
                // PIN exists but not unlocked this session
                setIsLocked(true);
                setIsSettingPin(false);
            } else {
                // Already unlocked this session
                setIsLocked(false);
            }
        } else {
            setIsLocked(false);
        }
    }, [user, isLoading]);

    // Focus input when locked
    useEffect(() => {
        if (isLocked && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLocked]);

    const handleSetPin = () => {
        if (pin.length < 4) {
            toast({ title: "PIN too short", description: "PIN must be at least 4 digits", variant: "destructive" });
            return;
        }
        if (pin !== confirmPin) {
            toast({ title: "PIN mismatch", description: "PINs do not match", variant: "destructive" });
            return;
        }

        localStorage.setItem(LOCK_PIN_KEY, pin);
        sessionStorage.setItem(UNLOCK_SESSION_KEY, "true");
        setIsLocked(false);
        setIsSettingPin(false);
        setPin("");
        setConfirmPin("");
        toast({ title: "PIN Set!", description: "Your app is now protected" });
    };

    const handleUnlock = () => {
        const storedPin = localStorage.getItem(LOCK_PIN_KEY);

        if (pin === storedPin) {
            sessionStorage.setItem(UNLOCK_SESSION_KEY, "true");
            setIsLocked(false);
            setPin("");
            setAttempts(0);
        } else {
            setAttempts(prev => prev + 1);
            setPin("");

            if (attempts >= 4) {
                toast({
                    title: "Too many attempts",
                    description: "Please try again later",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Wrong PIN",
                    description: `${5 - attempts - 1} attempts remaining`,
                    variant: "destructive"
                });
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (isSettingPin) {
                if (confirmPin) handleSetPin();
            } else {
                handleUnlock();
            }
        }
    };

    // Show loading or let through if not applicable
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    // If not locked or no user (onboarding), show children
    if (!isLocked || !user) {
        return <>{children}</>;
    }

    // Lock Screen UI
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6">
            {/* Logo and Icon */}
            <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <Shield className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">SahKosh</h1>
                <p className="text-gray-400 text-sm">
                    {isSettingPin ? "Set up your PIN" : "Enter PIN to unlock"}
                </p>
            </div>

            {/* PIN Input Card */}
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        {isSettingPin ? <KeyRound className="w-5 h-5 text-blue-400" /> : <Lock className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                        <p className="text-white font-semibold">
                            {isSettingPin ? "Create PIN" : "App Locked"}
                        </p>
                        <p className="text-gray-400 text-xs">
                            {isSettingPin ? "Choose a 4-6 digit PIN" : `Welcome back, ${user?.name?.split(" ")[0] || "User"}`}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* PIN Input */}
                    <div className="relative">
                        <Input
                            ref={inputRef}
                            type={showPin ? "text" : "password"}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            onKeyPress={handleKeyPress}
                            placeholder={isSettingPin ? "Enter new PIN" : "Enter PIN"}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center text-2xl tracking-[0.5em] h-14"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Confirm PIN (only when setting) */}
                    {isSettingPin && (
                        <Input
                            type={showPin ? "text" : "password"}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            onKeyPress={handleKeyPress}
                            placeholder="Confirm PIN"
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center text-2xl tracking-[0.5em] h-14"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="off"
                        />
                    )}

                    {/* PIN Dots Indicator */}
                    <div className="flex justify-center gap-2 py-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-all ${i < pin.length ? "bg-blue-500 scale-110" : "bg-white/20"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={isSettingPin ? handleSetPin : handleUnlock}
                        disabled={pin.length < 4 || (isSettingPin && confirmPin.length < 4)}
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30"
                    >
                        {isSettingPin ? "Set PIN & Unlock" : "Unlock"}
                    </Button>
                </div>

                {/* Attempts remaining */}
                {!isSettingPin && attempts > 0 && (
                    <p className="text-red-400 text-xs text-center mt-4">
                        {5 - attempts} attempts remaining
                    </p>
                )}

                {/* Forgot PIN hint */}
                {!isSettingPin && (
                    <p className="text-gray-500 text-xs text-center mt-4">
                        Forgot PIN? Clear app data to reset.
                    </p>
                )}
            </div>

            {/* Skip option (only when setting up) */}
            {isSettingPin && (
                <button
                    onClick={() => {
                        localStorage.setItem(LOCK_PIN_KEY, "0000");
                        sessionStorage.setItem(UNLOCK_SESSION_KEY, "true");
                        setIsLocked(false);
                        toast({ title: "Default PIN set to 0000", description: "You can change it in settings" });
                    }}
                    className="mt-6 text-gray-500 text-sm hover:text-gray-300 transition-colors"
                >
                    Skip for now (sets PIN to 0000)
                </button>
            )}
        </div>
    );
}

// Export function to reset PIN (for profile settings)
export function resetAppPin() {
    localStorage.removeItem(LOCK_PIN_KEY);
    sessionStorage.removeItem(UNLOCK_SESSION_KEY);
}

// Export function to change PIN
export function changeAppPin(newPin: string) {
    if (newPin.length >= 4) {
        localStorage.setItem(LOCK_PIN_KEY, newPin);
        return true;
    }
    return false;
}

// Export function to check if PIN is set
export function isAppPinSet() {
    return !!localStorage.getItem(LOCK_PIN_KEY);
}
