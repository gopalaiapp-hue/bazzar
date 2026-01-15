import React, { useState, useRef, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";

interface ReceiptViewerProps {
    isOpen: boolean;
    onClose: () => void;
    receiptUrl: string;
    merchantName?: string;
}

export function ReceiptViewer({ isOpen, onClose, receiptUrl, merchantName }: ReceiptViewerProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Touch handling for pinch-to-zoom
    const lastTouchDistance = useRef<number>(0);
    const lastTouchPosition = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.5, 5));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.5, 0.5));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleReset = useCallback(() => {
        setScale(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    }, []);

    const handleClose = useCallback(() => {
        handleReset();
        setIsLoading(true);
        setHasError(false);
        onClose();
    }, [onClose, handleReset]);

    // Touch handlers for pinch-to-zoom and pan
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch start
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            lastTouchDistance.current = distance;
        } else if (e.touches.length === 1 && scale > 1) {
            // Pan start
            isDragging.current = true;
            lastTouchPosition.current = {
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y,
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch move
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = distance - lastTouchDistance.current;
            const newScale = Math.min(Math.max(scale + delta * 0.01, 0.5), 5);
            setScale(newScale);
            lastTouchDistance.current = distance;
        } else if (e.touches.length === 1 && isDragging.current && scale > 1) {
            // Pan move
            setPosition({
                x: e.touches[0].clientX - lastTouchPosition.current.x,
                y: e.touches[0].clientY - lastTouchPosition.current.y,
            });
        }
    };

    const handleTouchEnd = () => {
        lastTouchDistance.current = 0;
        isDragging.current = false;
    };

    // Swipe down to close
    const handleSwipeDown = (e: React.TouchEvent) => {
        if (scale === 1 && e.changedTouches[0].clientY > 100) {
            handleClose();
        }
    };

    // Double tap to zoom
    const lastTap = useRef<number>(0);
    const handleDoubleTap = (e: React.TouchEvent) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if (scale > 1) {
                handleReset();
            } else {
                setScale(2);
            }
        }
        lastTap.current = now;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
                    onClick={(e) => e.target === e.currentTarget && handleClose()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex-1">
                            {merchantName && (
                                <p className="text-white text-sm font-medium truncate">
                                    📄 {merchantName}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Image Container */}
                    <div
                        ref={containerRef}
                        className="flex-1 flex items-center justify-center overflow-hidden"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={(e) => {
                            handleTouchEnd();
                            handleSwipeDown(e);
                            handleDoubleTap(e);
                        }}
                    >
                        {isLoading && !hasError && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                            </div>
                        )}

                        {hasError ? (
                            <div className="text-center text-white p-8">
                                <div className="text-6xl mb-4">📷</div>
                                <p className="text-lg font-medium mb-2">Unable to load receipt</p>
                                <p className="text-sm text-white/60">The image may be corrupted or unavailable</p>
                                <Button
                                    onClick={handleClose}
                                    className="mt-6 bg-white/20 hover:bg-white/30"
                                >
                                    Close
                                </Button>
                            </div>
                        ) : (
                            <motion.img
                                ref={imageRef}
                                src={receiptUrl}
                                alt="Receipt"
                                className="max-w-full max-h-full object-contain select-none"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                                    transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
                                }}
                                onLoad={() => setIsLoading(false)}
                                onError={() => {
                                    setIsLoading(false);
                                    setHasError(true);
                                }}
                                draggable={false}
                            />
                        )}
                    </div>

                    {/* Controls Footer */}
                    {!hasError && (
                        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center justify-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleZoomOut}
                                    className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                                    disabled={scale <= 0.5}
                                >
                                    <ZoomOut className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleZoomIn}
                                    className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                                    disabled={scale >= 5}
                                >
                                    <ZoomIn className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRotate}
                                    className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                                >
                                    <RotateCw className="h-5 w-5" />
                                </Button>
                                {(scale !== 1 || rotation !== 0) && (
                                    <Button
                                        variant="ghost"
                                        onClick={handleReset}
                                        className="text-white hover:bg-white/20 rounded-full px-4 text-sm"
                                    >
                                        Reset
                                    </Button>
                                )}
                            </div>
                            <p className="text-center text-white/50 text-xs mt-2">
                                Pinch to zoom • Double tap to toggle zoom
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
