import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";
import { Button } from "./button";
import { ReceiptViewer } from "./ReceiptViewer";
import { Edit2, Trash2, Check, Calendar, CreditCard, User, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
    id: string;
    type: "debit" | "credit";
    amount: number;
    merchant: string;
    category: string;
    icon: string;
    date: string;
    paymentMethod: string;
    paidBy: string;
    notes: string;
    isBorrowed: boolean;
    lenderName?: string;
    lenderPhone?: string;
    isShared: boolean;
    createdAt: number;
    editDeadline: number;
    receiptUrl?: string;
    hasSplit?: boolean;
    splitAmount1?: number;
    splitAmount2?: number;
    splitMethod1?: string;
    splitMethod2?: string;
}

interface ExpenseDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onEdit?: (tx: Transaction) => void;
    onDelete?: (id: string) => void;
    formatCurrency: (val: number) => string;
}

export function ExpenseDetailSheet({
    isOpen,
    onClose,
    transaction,
    onEdit,
    onDelete,
    formatCurrency,
}: ExpenseDetailSheetProps) {
    const { t } = useTranslation();
    const [showReceiptViewer, setShowReceiptViewer] = useState(false);

    if (!transaction) return null;

    const tx = transaction;
    const canEdit = Date.now() - tx.createdAt < 3600000; // 1 hour
    const timeLeft = Math.max(0, Math.floor((tx.editDeadline - Date.now()) / 60000));
    const isExpense = tx.type === "debit";

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
                    <SheetHeader className="pb-4 border-b">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                                isExpense ? "bg-red-50" : "bg-green-50"
                            )}>
                                {tx.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <SheetTitle className="text-lg font-bold">{tx.merchant}</SheetTitle>
                                <p className="text-sm text-muted-foreground">{tx.category}</p>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "text-2xl font-bold",
                                    isExpense ? "text-red-600" : "text-green-600"
                                )}>
                                    {isExpense ? "-" : "+"}{formatCurrency(tx.amount)}
                                </p>
                                {canEdit && (
                                    <p className="text-xs text-blue-500 font-medium">⏱️ {timeLeft}m left to edit</p>
                                )}
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="py-4 space-y-4">
                        {/* Transaction Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <DetailItem
                                icon={<Calendar className="w-4 h-4" />}
                                label="Date"
                                value={tx.date}
                            />
                            <DetailItem
                                icon={<CreditCard className="w-4 h-4" />}
                                label="Payment"
                                value={tx.paymentMethod}
                            />
                            <DetailItem
                                icon={<User className="w-4 h-4" />}
                                label="Paid By"
                                value={tx.paidBy}
                            />
                            <DetailItem
                                icon={<span className="text-sm">{isExpense ? "📤" : "📥"}</span>}
                                label="Type"
                                value={isExpense ? "Expense" : "Income"}
                            />
                        </div>

                        {/* Split Payment Info */}
                        {tx.hasSplit && (
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-700 font-medium mb-2">💳 Split Payment</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-600">{tx.splitMethod1}</p>
                                        <p className="font-semibold">₹{tx.splitAmount1?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">{tx.splitMethod2}</p>
                                        <p className="font-semibold">₹{tx.splitAmount2?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Borrowed Info */}
                        {tx.isBorrowed && (
                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                <p className="text-xs text-orange-700 font-medium mb-1">📌 Borrowed Money</p>
                                <p className="text-sm font-medium text-orange-800">From: {tx.lenderName}</p>
                                {tx.lenderPhone && (
                                    <p className="text-xs text-orange-600">📞 {tx.lenderPhone}</p>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        {tx.notes && (
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <p className="text-xs text-gray-500 font-medium">Notes</p>
                                </div>
                                <p className="text-sm text-gray-700">{tx.notes}</p>
                            </div>
                        )}

                        {/* Receipt Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Image className="w-4 h-4 text-gray-500" />
                                <p className="text-sm font-medium text-gray-700">Receipt</p>
                            </div>

                            {tx.receiptUrl ? (
                                <div className="space-y-3">
                                    {/* Thumbnail Preview */}
                                    <div
                                        className="relative w-full h-32 bg-white rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => setShowReceiptViewer(true)}
                                    >
                                        <img
                                            src={tx.receiptUrl}
                                            alt="Receipt preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium">
                                                👁️ Tap to view
                                            </span>
                                        </div>
                                    </div>

                                    {/* View Receipt Button */}
                                    <Button
                                        onClick={() => setShowReceiptViewer(true)}
                                        className="w-full bg-primary hover:bg-primary/90"
                                    >
                                        <Image className="w-4 h-4 mr-2" />
                                        {t('transaction.viewReceipt', 'View Receipt')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Image className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {t('transaction.noReceiptAttached', 'No receipt attached for this expense')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Shared Badge */}
                        {tx.isShared && (
                            <div className="flex items-center justify-center gap-2 py-2">
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                                    👥 Shared Expense
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t pt-4 pb-2 space-y-3">
                        {canEdit && (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onClose();
                                        onEdit?.(tx);
                                    }}
                                    className="flex-1"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        onClose();
                                        onDelete?.(tx.id);
                                    }}
                                    className="flex-1"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        )}

                        {tx.isBorrowed && (
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                <Check className="w-4 h-4 mr-2" />
                                Mark as Settled
                            </Button>
                        )}

                        <Button variant="ghost" onClick={onClose} className="w-full">
                            Close
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Receipt Viewer Modal */}
            <ReceiptViewer
                isOpen={showReceiptViewer}
                onClose={() => setShowReceiptViewer(false)}
                receiptUrl={tx.receiptUrl || ""}
                merchantName={tx.merchant}
            />
        </>
    );
}

// Helper component for detail items
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg">
            <div className="text-gray-400">{icon}</div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
        </div>
    );
}
