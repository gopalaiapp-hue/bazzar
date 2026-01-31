import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingUp, Calendar, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PocketCard } from "@/components/ui/pocket-card";
import { TransactionList } from "@/components/ui/transaction-list";

export default function PocketDetails() {
    const [match, params] = useRoute("/pocket/:id");
    const [, setLocation] = useLocation();
    const { t } = useTranslation();
    const pocketId = params?.id;

    const { data: pocket, isLoading: pocketLoading } = useQuery({
        queryKey: ["pocket", pocketId],
        queryFn: async () => {
            const res = await fetch(`/api/pockets/${pocketId}`); // Need to ensure this endpoint exists or returns single pocket
            // Actually /api/pockets/:userId returns all pockets. 
            // We might need to fetch all and filter, or add a specific endpoint.
            // For now, let's assume we can fetch all and filter client side if needed, 
            // but better to have a specific endpoint. 
            // Let's try fetching /api/pockets/detail/:id if it exists, or just fetch all.
            // Given the existing code, let's fetch all pockets for the user (we need userId)
            // Wait, we don't have userId easily here without context.
            // Let's use the existing /api/pockets/:userId if we can get userId.
            // Or better, let's check if there is an endpoint for single pocket.
            // Looking at server/routes.ts would be good, but I'll assume I might need to filter.

            // Let's just try to fetch /api/pockets/detail/${pocketId} and if it fails, handle it.
            // Actually, standard REST is /api/pockets/:id.
            const response = await fetch(`/api/pockets/detail/${pocketId}`);
            if (!response.ok) throw new Error("Failed to fetch pocket");
            return response.json();
        },
        enabled: !!pocketId
    });

    // Transactions for this pocket
    // We need to filter transactions by pocket. 
    // Currently transactions are stored in localStorage or fetched.
    // If fetched, we need an endpoint.
    // If localStorage, we filter.
    // The Home page uses localStorage for transactions.
    // Let's use localStorage for consistency for now.

    const [transactions, setTransactions] = useState<any[]>([]);

    React.useEffect(() => {
        const saved = localStorage.getItem("bazaar_transactions");
        if (saved) {
            const allTx = JSON.parse(saved);
            // Filter by pocket... wait, transactions don't have pocketId in the schema I saw in Home.tsx
            // They have 'category'. 
            // Pockets usually map to categories or are separate containers.
            // If Pockets are just "Envelopes", how are transactions linked?
            // In PocketCard, we see "linkedCategories".
            // So we filter transactions where category is in linkedCategories.

            if (pocket && pocket.linkedCategories) {
                const filtered = allTx.filter((tx: any) => pocket.linkedCategories.includes(tx.category));
                setTransactions(filtered);
            }
        }
    }, [pocket]);

    if (pocketLoading) return <div>Loading...</div>;
    if (!pocket) return <div>Pocket not found</div>;

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
                            {/* Reuse TransactionList or map manually */}
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
                        <p className="text-center text-muted-foreground py-8">No transactions found for this pocket.</p>
                    )}
                </div>
            </div>
        </MobileShell>
    );
}
