import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface AccountTypeDetails {
    id: "mai_sirf" | "couple" | "joint";
    title: string;
    icon: string;
    description: string;
    features: string[];
    quickAccessButtons: string[];
    dedicatedPages: string[];
}

const ACCOUNT_TYPE_DETAILS: Record<string, AccountTypeDetails> = {
    mai_sirf: {
        id: "mai_sirf",
        title: "Mai Sirf (Single/Bachelor)",
        icon: "🧍",
        description: "Perfect for individuals managing their own finances",
        features: [
            "Personal expense tracking",
            "Individual budgets",
            "Personal goals",
            "Solo transaction history"
        ],
        quickAccessButtons: ["Pockets", "Transactions", "Goals"],
        dedicatedPages: []
    },
    couple: {
        id: "couple",
        title: "Couple",
        icon: "👫",
        description: "Designed for couples managing shared finances together",
        features: [
            "Shared expense tracking",
            "Partner split calculations",
            "Fair share points & rewards",
            "Couple's expense comparison"
        ],
        quickAccessButtons: [
            "Shared Expenses 👫",
            "Partner Split 💑",
            "Goals"
        ],
        dedicatedPages: [
            "Couple Page - Track expenses together",
            "Fair Share Rewards - Earn trip rewards"
        ]
    },
    joint: {
        id: "joint",
        title: "Joint Family",
        icon: "👨‍👩‍👧‍👦",
        description: "For large families with shared household expenses",
        features: [
            "Family expense tracking",
            "Member contributions",
            "Household budget management",
            "Multi-member transaction history"
        ],
        quickAccessButtons: [
            "Family Expenses 👨‍👩‍👧‍👦",
            "Member Contributions 🏠",
            "Goals"
        ],
        dedicatedPages: [
            "Family Page - Manage household finances",
            "Member management"
        ]
    }
};

export function AccountTypeDetailsSheet({
    type,
    open,
    onOpenChange,
    onSelect
}: {
    type: "mai_sirf" | "couple" | "joint";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: () => void;
}) {
    const details = ACCOUNT_TYPE_DETAILS[type];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-2xl">
                        <span className="text-4xl">{details.icon}</span>
                        {details.title}
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6 pb-6">
                    <p className="text-muted-foreground">{details.description}</p>

                    <div>
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                            <span className="text-xl">✨</span>
                            Features Included
                        </h3>
                        <ul className="space-y-2">
                            {details.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {details.quickAccessButtons.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <span className="text-xl">🚀</span>
                                Quick Access Buttons
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {details.quickAccessButtons.map((btn, idx) => (
                                    <div key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                                        {btn}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {details.dedicatedPages.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <span className="text-xl">📄</span>
                                Dedicated Pages
                            </h3>
                            <ul className="space-y-2">
                                {details.dedicatedPages.map((page, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-blue-600">→</span>
                                        <span>{page}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button
                        onClick={() => {
                            onSelect();
                            onOpenChange(false);
                        }}
                        className="w-full"
                        size="lg"
                    >
                        Select {details.title}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
