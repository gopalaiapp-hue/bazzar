import React from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { FileText, Download, ChevronRight, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import type { TaxData } from "@shared/schema";
import { useLocation } from "wouter";
import { useUser } from "@/context/UserContext";
import { apiUrl } from "@/lib/api-config";

export default function Tax() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id;

  const { data: taxData, isLoading } = useQuery<TaxData>({
    queryKey: ["tax", userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(apiUrl(`/api/tax/${userId}`));
      if (!res.ok) throw new Error("Failed to fetch tax data");
      const data = await res.json();
      return data.taxData;
    },
    enabled: !!userId,
  });

  // AUTH GUARD: Show loading while checking user
  if (isUserLoading) {
    return (
      <MobileShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileShell>
    );
  }

  // AUTH GUARD: Redirect if not logged in
  if (!user || !userId) {
    return (
      <MobileShell>
        <div className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Please log in to view tax information.</p>
          <Button onClick={() => setLocation("/")}>Go to Login</Button>
        </div>
      </MobileShell>
    );
  }

  if (isLoading) {
    return (
      <MobileShell>
        <div className="p-6 flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileShell>
    );
  }

  const currentTaxPayable = taxData?.regime === "old" ? taxData?.taxPayableOld : taxData?.taxPayableNew;
  const isNewRegime = taxData?.regime === "new";

  return (
    <MobileShell>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-heading font-bold">Tax Engine</h1>
            <p className="text-muted-foreground text-sm">AY {taxData?.assessmentYear || "2025-26"} • Due in 45 Days</p>
          </div>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" /> Reports
          </Button>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-bl-full" />

          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Estimated Tax</p>
              <h2 className="text-3xl font-bold">₹{(currentTaxPayable || 0).toLocaleString()}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
              {isNewRegime ? "New Regime" : "Old Regime"}
            </div>
          </div>

          <Button className="w-full bg-white text-primary hover:bg-blue-50 font-semibold border-none">
            File Now for FREE <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Checklist */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Documents Ready</h3>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Form 16</h4>
                  <p className="text-xs text-muted-foreground">Imported from Email</p>
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">READY</span>
            </div>

            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">AIS / TIS</h4>
                  <p className="text-xs text-muted-foreground">Synced from IT Portal</p>
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">READY</span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Capital Gains</h4>
                  <p className="text-xs text-muted-foreground">Link Demat Account</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-xs text-primary h-6">Link</Button>
            </div>
          </div>
        </section>

        {/* Regime Comparison */}
        <section className="bg-gray-900 rounded-2xl p-6 text-white">
          <h3 className="font-bold mb-4">Old vs New Regime</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">New Regime (Recommended)</span>
                <span className="font-bold text-green-400">₹{(taxData?.taxPayableNew || 0).toLocaleString()}</span>
              </div>
              <Progress value={40} className="h-2 bg-gray-700" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Old Regime</span>
                <span className="font-bold text-gray-300">₹{(taxData?.taxPayableOld || 0).toLocaleString()}</span>
              </div>
              <Progress value={65} className="h-2 bg-gray-700" />
            </div>
            <p className="text-xs text-gray-400 pt-2">
              You save <span className="text-green-400 font-bold">₹{Math.abs((taxData?.taxPayableOld || 0) - (taxData?.taxPayableNew || 0)).toLocaleString()}</span> with the New Regime.
            </p>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
