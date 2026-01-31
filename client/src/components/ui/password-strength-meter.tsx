import React from "react";

interface PasswordStrengthMeterProps {
    password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
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

    const getStrengthColor = (strength: number) => {
        switch (strength) {
            case 0: return "bg-red-500";
            case 1: return "bg-red-400";
            case 2: return "bg-yellow-500";
            case 3: return "bg-blue-500";
            case 4: return "bg-green-500";
            default: return "bg-gray-300";
        }
    };

    const getStrengthLabel = (strength: number) => {
        switch (strength) {
            case 0: return "Very Weak";
            case 1: return "Weak";
            case 2: return "Fair";
            case 3: return "Good";
            case 4: return "Strong";
            default: return "";
        }
    };

    const strength = getPasswordStrength(password);
    const strengthPercentage = (strength / 4) * 100;

    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">
                    Password Strength: {getStrengthLabel(strength)}
                </span>
                {password.length > 0 && (
                    <span className="text-xs text-gray-500">
                        {password.length}/12 characters
                    </span>
                )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
                    style={{ width: `${strengthPercentage}%` }}
                ></div>
            </div>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-2">✓</span> At least one uppercase letter
                </div>
                <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-2">✓</span> At least one lowercase letter
                </div>
                <div className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-2">✓</span> At least one number
                </div>
                <div className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-2">✓</span> At least one special character
                </div>
                <div className={`flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-2">✓</span> At least 8 characters (12+ recommended)
                </div>
            </div>
        </div>
    );
};