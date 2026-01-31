import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableItemProps {
    children: React.ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    disabled?: boolean;
    className?: string;
}

export function SwipeableItem({
    children,
    onDelete,
    onEdit,
    disabled = false,
    className
}: SwipeableItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const constraintsRef = useRef(null);
    const x = useMotionValue(0);

    // Transform for background opacity
    const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
    const editOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 80;

        if (info.offset.x < -threshold && onDelete) {
            // Swiped left - show delete
            setIsOpen(true);
        } else if (info.offset.x > threshold && onEdit) {
            // Swiped right - trigger edit
            onEdit();
            x.set(0);
        } else {
            // Reset position
            setIsOpen(false);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete();
        }
        setIsOpen(false);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit();
        }
        setIsOpen(false);
    };

    if (disabled) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div className="relative overflow-hidden rounded-xl" ref={constraintsRef}>
            {/* Delete Action Background (Left Swipe) */}
            <motion.div
                className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-gradient-to-l from-red-500 to-red-400"
                style={{
                    opacity: deleteOpacity,
                    width: '100px',
                }}
            >
                <button
                    onClick={handleDelete}
                    className="flex flex-col items-center gap-1 text-white"
                >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-xs font-medium">Delete</span>
                </button>
            </motion.div>

            {/* Edit Action Background (Right Swipe) */}
            {onEdit && (
                <motion.div
                    className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{
                        opacity: editOpacity,
                        width: '100px',
                    }}
                >
                    <button
                        onClick={handleEdit}
                        className="flex flex-col items-center gap-1 text-white"
                    >
                        <Edit2 className="w-5 h-5" />
                        <span className="text-xs font-medium">Edit</span>
                    </button>
                </motion.div>
            )}

            {/* Main Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: onEdit ? 100 : 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={{ x: isOpen ? -80 : 0 }}
                style={{ x }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn("relative bg-white cursor-grab active:cursor-grabbing", className)}
            >
                {children}
            </motion.div>

            {/* Delete button when swiped open */}
            {isOpen && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleDelete}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                >
                    <Trash2 className="w-6 h-6 text-white" />
                </motion.button>
            )}
        </div>
    );
}

// Alternative simple swipe component for lists
export function SwipeToDelete({
    children,
    onDelete,
    className,
}: {
    children: React.ReactNode;
    onDelete: () => void;
    className?: string;
}) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = startX.current - currentX;
        // Only allow left swipe
        if (diff > 0) {
            setOffset(Math.min(diff, 100));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (offset > 60) {
            // Keep open for delete
            setOffset(80);
        } else {
            setOffset(0);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
        setOffset(0);
    };

    return (
        <div className={cn("relative overflow-hidden rounded-xl", className)}>
            {/* Delete background */}
            <div
                className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center transition-all"
                style={{ width: Math.max(offset, 0) }}
            >
                {offset > 40 && (
                    <button
                        onClick={handleDeleteClick}
                        className="flex flex-col items-center text-white px-3"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span className="text-[10px] font-medium mt-1">Delete</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: `translateX(-${offset}px)` }}
                className="relative bg-white transition-transform duration-150"
            >
                {children}
            </div>
        </div>
    );
}
