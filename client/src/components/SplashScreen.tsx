import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6">
            {/* Animated Logo */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-8"
            >
                <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                    <motion.div
                        animate={{
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="text-6xl"
                    >
                        🏛️
                    </motion.div>
                </div>
            </motion.div>

            {/* App Name */}
            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl font-heading font-bold text-white mb-3"
            >
                SahKosh
            </motion.h1>

            {/* Tagline */}
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-white/90 text-lg mb-12"
            >
                Your Family's Money Manager
            </motion.p>

            {/* Loading Dots Animation */}
            <motion.div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                        className="w-3 h-3 bg-white rounded-full"
                    />
                ))}
            </motion.div>
        </div>
    );
}
