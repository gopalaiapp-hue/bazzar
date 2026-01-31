import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const threshold = 80;
    const maxPull = 120;

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (containerRef.current?.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            // Apply resistance
            const resistance = 0.4;
            const newDistance = Math.min(diff * resistance, maxPull);
            setPullDistance(newDistance);
        }
    }, [isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        isPulling.current = false;

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold / 2);

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, isRefreshing, onRefresh]);

    const progress = Math.min(pullDistance / threshold, 1);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-auto", className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <div
                className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 z-10 pointer-events-none"
                style={{
                    top: pullDistance - 48,
                    opacity: progress
                }}
            >
                <div className={cn(
                    "w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center",
                    isRefreshing && "animate-spin"
                )}>
                    <RefreshCw
                        className={cn(
                            "w-5 h-5 text-emerald-600 transition-transform",
                            !isRefreshing && "duration-200"
                        )}
                        style={{
                            transform: isRefreshing ? 'rotate(0deg)' : `rotate(${progress * 180}deg)`
                        }}
                    />
                </div>
            </div>

            {/* Content */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${pullDistance}px)`
                }}
            >
                {children}
            </div>
        </div>
    );
}

// Simple hook for pull-to-refresh logic
export function usePullToRefresh(onRefresh: () => Promise<void>) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    }, [onRefresh, isRefreshing]);

    return { isRefreshing, refresh };
}
