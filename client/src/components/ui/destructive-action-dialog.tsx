import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DestructiveActionDialogProps {
    trigger: React.ReactNode;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
    className?: string;
}

export function DestructiveActionDialog({
    trigger,
    title,
    description,
    confirmText = "Delete Permanently",
    onConfirm,
    className
}: DestructiveActionDialogProps) {
    const [open, setOpen] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (open && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [open, countdown]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setCountdown(10);
            setIsDeleting(false);
        }
    }, [open]);

    const handleConfirm = async () => {
        if (countdown > 0) return;

        setIsDeleting(true);
        try {
            await onConfirm();
            setOpen(false);
        } catch (error) {
            console.error("Action failed:", error);
            // Optional: Add error toast here if needed, but usually handled by parent
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-md", className)}>
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl text-red-600">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2 font-medium text-gray-600">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-50 p-4 rounded-lg border border-red-100 my-4 text-sm text-red-800">
                    <p className="font-bold flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Warning: This action is irreversible
                    </p>
                    <ul className="list-disc pl-5 space-y-1 opacity-90">
                        <li>All your data will be permanently wiped.</li>
                        <li>You cannot recover this account.</li>
                        <li>Family members will lose access to shared data.</li>
                    </ul>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isDeleting}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={countdown > 0 || isDeleting}
                        className="w-full sm:w-auto min-w-[140px]"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : countdown > 0 ? (
                            `Wait ${countdown}s`
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {confirmText}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
