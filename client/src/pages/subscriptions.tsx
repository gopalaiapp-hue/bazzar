import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { Plus, Trash2, Bell, BellOff, CreditCard, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subscription {
    id: number;
    userId: string;
    name: string;
    amount: number;
    dueDate?: number;
    category?: string;
    icon?: string;
    isActive: boolean;
    reminderDays?: number;
    notifyOnRenewal?: boolean;
    createdAt?: string;
}

const SUBSCRIPTION_TEMPLATES = [
    { name: "Netflix", icon: "🎬", category: "streaming", defaultAmount: 649 },
    { name: "Hotstar", icon: "⭐", category: "streaming", defaultAmount: 299 },
    { name: "Amazon Prime", icon: "📦", category: "streaming", defaultAmount: 179 },
    { name: "Spotify", icon: "🎵", category: "music", defaultAmount: 119 },
    { name: "YouTube Premium", icon: "▶️", category: "streaming", defaultAmount: 139 },
    { name: "Gym Membership", icon: "💪", category: "fitness", defaultAmount: 1500 },
    { name: "Mobile Recharge", icon: "📱", category: "telecom", defaultAmount: 599 },
    { name: "Broadband", icon: "📶", category: "telecom", defaultAmount: 999 },
    { name: "Newspaper", icon: "📰", category: "other", defaultAmount: 350 },
    { name: "Other", icon: "📺", category: "other", defaultAmount: 0 },
];

export default function Subscriptions() {
    const { toast } = useToast();
    const { user } = useUser();
    const queryClient = useQueryClient();

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<typeof SUBSCRIPTION_TEMPLATES[0] | null>(null);
    const [customName, setCustomName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [reminderDays, setReminderDays] = useState("3");
    const [notifyOnRenewal, setNotifyOnRenewal] = useState(true);

    // Fetch subscriptions
    const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
        queryKey: ["subscriptions", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await fetch(`/api/subscriptions/${user.id}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            return data.subscriptions || [];
        },
        enabled: !!user?.id
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (sub: Partial<Subscription>) => {
            const res = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sub),
            });
            if (!res.ok) throw new Error("Failed to create");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            setShowAddDialog(false);
            resetForm();
            toast({ title: "Added!", description: "Subscription added successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to add subscription", variant: "destructive" });
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Subscription> }) => {
            const res = await fetch(`/api/subscriptions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            toast({ title: "Removed", description: "Subscription deleted" });
        }
    });

    const resetForm = () => {
        setSelectedTemplate(null);
        setCustomName("");
        setAmount("");
        setDueDate("");
        setReminderDays("3");
        setNotifyOnRenewal(true);
    };

    const handleAddSubscription = () => {
        if (!user?.id) return;

        const name = selectedTemplate?.name === "Other" ? customName : selectedTemplate?.name;
        if (!name || !amount) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        createMutation.mutate({
            userId: user.id,
            name,
            amount: parseInt(amount),
            dueDate: dueDate ? parseInt(dueDate) : undefined,
            category: selectedTemplate?.category || "other",
            icon: selectedTemplate?.icon || "📺",
            isActive: true,
            reminderDays: parseInt(reminderDays),
            notifyOnRenewal,
        });
    };

    const toggleActive = (sub: Subscription) => {
        updateMutation.mutate({ id: sub.id, data: { isActive: !sub.isActive } });
    };

    const toggleNotify = (sub: Subscription) => {
        updateMutation.mutate({ id: sub.id, data: { notifyOnRenewal: !sub.notifyOnRenewal } });
    };

    // Calculate totals
    const activeSubscriptions = subscriptions.filter(s => s.isActive);
    const monthlyTotal = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);
    const yearlyTotal = monthlyTotal * 12;

    const { isLoading: isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <MobileShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            </MobileShell>
        );
    }

    if (!user) return null;

    return (
        <MobileShell>
            <div className="p-4 pb-24">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
                            Subscriptions <CreditCard className="w-6 h-6 text-purple-600" />
                        </h1>
                        <p className="text-muted-foreground text-sm">{activeSubscriptions.length} active subscriptions</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white">
                        <p className="text-xs opacity-80">Monthly Total</p>
                        <p className="text-2xl font-bold">₹{monthlyTotal.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-2xl text-white">
                        <p className="text-xs opacity-80">Yearly Cost</p>
                        <p className="text-2xl font-bold">₹{yearlyTotal.toLocaleString()}</p>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="space-y-3 mb-6">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-400">Loading...</div>
                    ) : subscriptions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">No subscriptions yet</p>
                            <p className="text-xs">Add your recurring subscriptions to track them</p>
                        </div>
                    ) : (
                        subscriptions.map((sub) => (
                            <div
                                key={sub.id}
                                className={cn(
                                    "bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between",
                                    !sub.isActive && "opacity-50 bg-gray-50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{sub.icon || "📺"}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm">{sub.name}</p>
                                            {!sub.isActive && (
                                                <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Paused</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            ₹{sub.amount}/mo
                                            {sub.dueDate && ` • Due: ${sub.dueDate}${getOrdinalSuffix(sub.dueDate)}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleNotify(sub)}
                                        className={sub.notifyOnRenewal ? "text-purple-600" : "text-gray-400"}
                                    >
                                        {sub.notifyOnRenewal ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    </Button>
                                    <Switch
                                        checked={sub.isActive}
                                        onCheckedChange={() => toggleActive(sub)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate(sub.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Button */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" /> Add Subscription
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Subscription</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Template Selection */}
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Choose Subscription</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {SUBSCRIPTION_TEMPLATES.map((template) => (
                                        <button
                                            key={template.name}
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                if (template.defaultAmount > 0) {
                                                    setAmount(template.defaultAmount.toString());
                                                }
                                            }}
                                            className={cn(
                                                "p-2 rounded-xl border text-center transition-all",
                                                selectedTemplate?.name === template.name
                                                    ? "border-purple-500 bg-purple-50"
                                                    : "border-gray-200 hover:border-purple-300"
                                            )}
                                        >
                                            <span className="text-2xl block">{template.icon}</span>
                                            <span className="text-[10px] text-gray-600 block mt-1 truncate">{template.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Name for "Other" */}
                            {selectedTemplate?.name === "Other" && (
                                <div>
                                    <Label className="text-sm font-medium">Subscription Name</Label>
                                    <Input
                                        placeholder="E.g., Zee5, Audible"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Amount */}
                            <div>
                                <Label className="text-sm font-medium">Monthly Amount (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="499"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <Label className="text-sm font-medium">Renewal Date (Day of Month)</Label>
                                <Select value={dueDate} onValueChange={setDueDate}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                                {day}{getOrdinalSuffix(day)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Reminder Settings */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Remind Before Renewal</Label>
                                    <p className="text-[10px] text-gray-500">Get notified before charges</p>
                                </div>
                                <Switch
                                    checked={notifyOnRenewal}
                                    onCheckedChange={setNotifyOnRenewal}
                                />
                            </div>

                            {notifyOnRenewal && (
                                <div>
                                    <Label className="text-sm font-medium">Days Before to Remind</Label>
                                    <Select value={reminderDays} onValueChange={setReminderDays}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 day before</SelectItem>
                                            <SelectItem value="3">3 days before</SelectItem>
                                            <SelectItem value="7">1 week before</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubscription}
                                disabled={!selectedTemplate || !amount || createMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {createMutation.isPending ? "Adding..." : "Add Subscription"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Cancellation Tips */}
                {activeSubscriptions.length > 3 && (
                    <div className="mt-6 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                        <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-bold text-sm text-amber-800">Subscription Check</p>
                                <p className="text-xs text-amber-700">
                                    You have {activeSubscriptions.length} active subscriptions costing ₹{yearlyTotal.toLocaleString()}/year.
                                    Review if you're using all of them!
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MobileShell>
    );
}

function getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}
