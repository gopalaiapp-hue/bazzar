import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "./sheet";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Wallet, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AddFundsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    goalName: string;
    onSubmit: (data: { amount: number; source: string; note?: string; date?: string }) => void;
    isLoading?: boolean;
}

export function AddFundsSheet({
    isOpen,
    onClose,
    goalName,
    onSubmit,
    isLoading = false,
}: AddFundsSheetProps) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState("");
    const [source, setSource] = useState("Cash");
    const [note, setNote] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) {
            return;
        }

        onSubmit({
            amount: Math.round(parseFloat(amount) * 100), // Convert to paise
            source,
            note: note.trim() || undefined,
            date,
        });

        // Reset form
        setAmount("");
        setSource("Cash");
        setNote("");
        setDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <SheetTitle className="text-lg font-bold">
                                {t('goals.addFunds', 'Add Funds')}
                            </SheetTitle>
                            <p className="text-sm text-muted-foreground">to {goalName}</p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="py-6 space-y-5">
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                            {t('transaction.amount', 'Amount (₹)')} *
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                ₹
                            </span>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="5000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8 text-lg font-semibold"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Source Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="source" className="text-sm font-medium">
                            {t('goals.source', 'Source')} *
                        </Label>
                        <Select value={source} onValueChange={setSource}>
                            <SelectTrigger id="source">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">💵 Cash</SelectItem>
                                <SelectItem value="Bank">🏦 Bank</SelectItem>
                                <SelectItem value="UPI">📱 UPI</SelectItem>
                                <SelectItem value="Pocket">💰 Pocket</SelectItem>
                                <SelectItem value="Other">📝 Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {t('home.date', 'Date')}
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Note Input */}
                    <div className="space-y-2">
                        <Label htmlFor="note" className="text-sm font-medium">
                            {t('goals.note', 'Note (Optional)')}
                        </Label>
                        <Textarea
                            id="note"
                            placeholder="E.g., Monthly savings, Bonus money..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Preview Summary */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-xs text-emerald-700 font-medium mb-2">
                            💰 You're adding
                        </p>
                        <p className="text-2xl font-bold text-emerald-800">
                            ₹{amount || '0'}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                            via {source}
                        </p>
                    </div>
                </div>

                <SheetFooter className="border-t pt-4 space-y-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isLoading ? "Adding..." : `Add ₹${amount || '0'} to Goal`}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
