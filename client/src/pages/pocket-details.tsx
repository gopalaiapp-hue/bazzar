import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingUp, Calendar, Target, RefreshCw, AlertCircle, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PocketCard } from "@/components/ui/pocket-card";
import { TransactionList } from "@/components/ui/transaction-list";
import { apiUrl } from "@/lib/api-config";

export default function PocketDetails() {
    const [match, params] = useRoute("/pocket/:id");
    const [, setLocation] = useLocation();
    const { t } = useTranslation();
    const pocketId = params?.id;
    const queryClient = useQueryClient();

    const { data: pocket, isLoading: pocketLoading, error: pocketError, refetch } = useQuery({
        queryKey: ["pocket", pocketId],
        queryFn: async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            try {
                const response = await fetch(apiUrl(`/api/pockets/detail/${pocketId}`), {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("POCKET_NOT_FOUND");
                    }
                    throw new Error(`Failed to fetch pocket: ${response.status}`);
                }
                return response.json();
            } catch (err: any) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                    throw new Error("Request timed out. Please check your connection.");
                }
                throw err;
            }
        },
        enabled: !!pocketId,
        retry: 2,
        retryDelay: 1000,
    });

    // Transactions for this pocket
    const [transactions, setTransactions] = useState<any[]>([]);

    React.useEffect(() => {
        const saved = localStorage.getItem("bazaar_transactions");
        if (saved) {
            const allTx = JSON.parse(saved);
            if (pocket && pocket.linkedCategories) {
                const filtered = allTx.filter((tx: any) => pocket.linkedCategories.includes(tx.category));
                setTransactions(filtered);
            }
        }
    }, [pocket]);

    // Loading state with proper UI
    if (pocketLoading) {
        return (
            <MobileShell
                header={
                    <div className="p-4 bg-white sticky top-0 z-10 shadow-sm flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-bold">Loading Pocket...</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-600">Loading pocket details...</p>
                </div>
            </MobileShell>
        );
    }

    // Error state with retry option
    if (pocketError) {
        const isNotFound = (pocketError as Error).message === "POCKET_NOT_FOUND";

        return (
            <MobileShell
                header={
                    <div className="p-4 bg-white sticky top-0 z-10 shadow-sm flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-bold">{isNotFound ? "Pocket Not Found" : "Error"}</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        {isNotFound ? (
                            <Wallet className="w-10 h-10 text-red-400" />
                        ) : (
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                        {isNotFound ? "Pocket Not Found" : "Unable to Load Pocket"}
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-6 max-w-[280px]">
                        {isNotFound
                            ? "This pocket may have been deleted or doesn't exist."
                            : (pocketError as Error).message || "Please check your internet connection and try again."
                        }
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setLocation("/home")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                        {!isNotFound && (
                            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        )}
                    </div>
                </div>
            </MobileShell>
        );
    }

    // Empty/No pocket state (shouldn't normally happen after loading completes)
    if (!pocket) {
        return (
            <MobileShell
                header={
                    <div className="p-4 bg-white sticky top-0 z-10 shadow-sm flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-bold">Pocket Details</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">No Pocket Data</h2>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Unable to load pocket information.
                    </p>
                    <Button onClick={() => setLocation("/home")} className="bg-blue-600 hover:bg-blue-700">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>
            </MobileShell>
        );
    }

    // Success state - Show pocket details
    return (
        <MobileShell
            header={
                <div className="p-4 bg-white sticky top-0 z-10 shadow-sm flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/home")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-bold">{pocket.name}</h1>
                </div>
            }
        >
            <div className="p-4 space-y-6">
                <PocketCard
                    id={String(pocket.id)}
                    name={pocket.name}
                    type={pocket.type}
                    amount={pocket.amount}
                    spent={pocket.spent}
                    targetAmount={pocket.targetAmount}
                    deadline={pocket.deadline}
                    monthlyContribution={pocket.monthlyContribution}
                    icon={pocket.icon}
                    color={pocket.color}
                />

                <div className="space-y-4">
                    <h2 className="text-lg font-bold">Transactions</h2>
                    {transactions.length > 0 ? (
                        <div className="space-y-2">
                            {transactions.map((tx: any) => (
                                <div key={tx.id} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{tx.icon}</div>
                                        <div>
                                            <p className="font-medium">{tx.merchant}</p>
                                            <p className="text-xs text-muted-foreground">{tx.date}</p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${tx.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                                        {tx.type === 'debit' ? '-' : '+'}₹{tx.amount}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">📭</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-1">No Transactions Yet</p>
                            <p className="text-xs text-muted-foreground">
                                Transactions linked to this pocket will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MobileShell>
    );
}
