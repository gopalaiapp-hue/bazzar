import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { Shield, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { hashPin, verifyPin } from "@/lib/pinHash";

const LOCK_PIN_KEY = "sahkosh_app_pin";
const UNLOCK_SESSION_KEY = "sahkosh_unlocked";

interface LockScreenProps {
    children: React.ReactNode;
}

export function LockScreen({ children }: LockScreenProps) {
    // BYPASSED FOR DEBUGGING
    return <>{children}</>;
}

// Export function to reset PIN (for profile settings)
export function resetAppPin() {
    localStorage.removeItem(LOCK_PIN_KEY);
    sessionStorage.removeItem(UNLOCK_SESSION_KEY);
}

// Export function to change PIN
export async function changeAppPin(newPin: string) {
    if (newPin.length >= 4) {
        const pinHash = await hashPin(newPin);
        localStorage.setItem(LOCK_PIN_KEY, pinHash);
        return true;
    }
    return false;
}

// Export function to check if PIN is set
export function isAppPinSet() {
    return !!localStorage.getItem(LOCK_PIN_KEY);
}
