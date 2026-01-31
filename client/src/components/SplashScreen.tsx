import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6">
            {/* Static Logo */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
            >
                <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                    <div className="text-6xl">
                        🏛️
                    </div>
                </div>
            </motion.div>

            {/* App Name */}
            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-5xl font-heading font-bold text-white mb-3"
            >
                SahKosh
            </motion.h1>

            {/* Tagline */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-white/90 text-lg"
            >
                Your Family's Money Manager
            </motion.p>
        </div>
    );
}
