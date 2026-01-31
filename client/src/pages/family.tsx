import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Share2, Shield, Plus, Trash2, Copy, Settings, Receipt, Crown, UserPlus, Check, X, Bell, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { useLocation } from "wouter";
import { formatCurrencyShort } from "@/lib/fairshare-utils";
import { cn } from "@/lib/utils";

interface FamilyMember {
  id: number;
  userId: string;
  name: string;
  relationship: string;
  phone?: string;
  income?: number;
  isNominee?: boolean;
  isVisible?: boolean;
}

interface LinkedUser {
  id: string;
  name: string;
  email: string;
  lastActiveAt?: string;
  role: string;
  linkedAdminId?: string;
}

interface JoinRequest {
  id: number;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  message?: string;
  status: string;
  createdAt: string;
  requesterId: string;
}

export default function Family() {
  const { toast } = useToast();
  const { user, familyType } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"members" | "requests" | "settings">("members");

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("");

  // Redirect if not joint family
  React.useEffect(() => {
    if (user && familyType !== "joint") {
      setLocation("/home");
      toast({ title: "Access Denied", description: "This feature is for joint families only", variant: "destructive" });
    }
  }, [user, familyType, setLocation, toast]);

  // Fetch existing invite code
  const { data: existingInvite } = useQuery({
    queryKey: ["inviteCode", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch("/api/auth/invite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.invite;
    },
    enabled: !!user?.id
  });

  // Fetch linked members (users who joined via invite code)
  const { data: linkedMembers = [] } = useQuery<LinkedUser[]>({
    queryKey: ["linkedMembers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/members/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.members || [];
    },
    enabled: !!user?.id
  });

  // Fetch family members (manually added)
  const { data: familyMembers = [] } = useQuery<FamilyMember[]>({
    queryKey: ["familyMembers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/family/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.members || [];
    },
    enabled: !!user?.id
  });

  // Fetch pending join requests
  const { data: joinRequests = [], refetch: refetchRequests } = useQuery<JoinRequest[]>({
    queryKey: ["joinRequests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/join/requests/${user.id}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.requests || [];
    },
    enabled: !!user?.id
  });

  // Regenerate invite code mutation
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/invite/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
      return res.json();
    },
    onSuccess: (data) => {
      setInviteCode(data.invite.code);
      queryClient.invalidateQueries({ queryKey: ["inviteCode"] });
      toast({ title: "Code Regenerated", description: "Old code is now invalid" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to regenerate code", variant: "destructive" });
    }
  });

  // Approve join request
  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(`/api/join/approve/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hofId: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joinRequests"] });
      queryClient.invalidateQueries({ queryKey: ["linkedMembers"] });
      toast({ title: "✅ Approved!", description: "Member has been added to your family" });
    }
  });

  // Reject join request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(`/api/join/reject/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hofId: user?.id, note: "Request declined" }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joinRequests"] });
      toast({ title: "Request Declined" });
    }
  });

  // Add family member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (member: { name: string; relationship: string }) => {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, ...member }),
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      setNewMemberName("");
      setNewMemberRelation("");
      toast({ title: "Member Added", description: "Family member added successfully" });
    }
  });

  // Delete family member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const res = await fetch(`/api/family/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
      toast({ title: "Removed", description: "Family member removed" });
    }
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  const shareViaWhatsApp = (code: string) => {
    const text = `Join my Family Vault on SahKosh! Use code: ${code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Combine all members
  const allMembers = [
    // Current user (Head)
    { id: "head", name: user?.name || "You", relationship: "Head of Family", isHead: true },
    // Linked users (joined via invite)
    ...linkedMembers.map(m => ({ ...m, relationship: "Member (Joined)", isLinked: true })),
    // Manually added family members
    ...familyMembers.map(m => ({ ...m, isManual: true }))
  ];

  const displayCode = inviteCode || existingInvite?.code || null;

  if (!user || familyType !== "joint") return null;

  return (
    <MobileShell>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              Family Vault <Users className="w-6 h-6 text-indigo-600" />
            </h1>
            <p className="text-muted-foreground text-sm">{allMembers.length} members</p>
          </div>
          {joinRequests.length > 0 && (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab("requests")}
                className="border-orange-200 text-orange-600"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {joinRequests.length}
              </span>
            </div>
          )}
        </div>

        {/* Invite Code Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl text-white mb-4 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-80 mb-1">Your Family Code (Never Expires)</p>
              <p className="text-2xl font-mono font-bold tracking-wider">
                {displayCode || "Generating..."}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => regenerateCodeMutation.mutate()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => displayCode && copyToClipboard(displayCode)}
            >
              <Copy className="w-4 h-4 mr-1" /> Copy
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => displayCode && shareViaWhatsApp(displayCode)}
            >
              <Share2 className="w-4 h-4 mr-1" /> WhatsApp
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4 bg-indigo-50/50">
            <TabsTrigger value="members" className="text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600">
              <Users className="w-4 h-4 mr-1" />
              Members
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600 relative">
              <UserPlus className="w-4 h-4 mr-1" />
              Requests
              {joinRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {joinRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 mt-0">
            {/* Member Cards */}
            <div className="space-y-3">
              {allMembers.map((member: any, idx) => (
                <div
                  key={member.id || idx}
                  className={cn(
                    "bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between",
                    member.isHead ? "border-indigo-200 bg-indigo-50/30" : "border-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarFallback className={cn(
                        "font-bold",
                        member.isHead ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {member.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{member.name || "Unknown"}</p>
                        {member.isHead && (
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Head
                          </span>
                        )}
                        {member.isLinked && (
                          <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Joined
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.relationship || member.email}</p>
                    </div>
                  </div>

                  {!member.isHead && member.isManual && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMemberMutation.mutate(member.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Manual Member */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Add Family Member (Manual)</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Name (e.g., Priya)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
                <Input
                  placeholder="Relationship (e.g., Spouse, Parent)"
                  value={newMemberRelation}
                  onChange={(e) => setNewMemberRelation(e.target.value)}
                />
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={!newMemberName || !newMemberRelation}
                  onClick={() => addMemberMutation.mutate({
                    name: newMemberName,
                    relationship: newMemberRelation
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Member
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4 mt-0">
            {joinRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No pending requests</p>
                <p className="text-xs">Share your invite code to add family members</p>
              </div>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-orange-100">
                          <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                            {request.requesterName?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{request.requesterName}</p>
                          <p className="text-xs text-muted-foreground">
                            {request.requesterEmail || request.requesterPhone || "No contact"}
                          </p>
                          {request.message && (
                            <p className="text-xs text-gray-500 mt-1 italic">"{request.message}"</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate(request.id)}
                        disabled={approveMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => rejectMutation.mutate(request.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-0">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-700">Family Settings</h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-Accept Join Requests</Label>
                  <p className="text-[10px] text-gray-500">Members join instantly without approval</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Show All Expenses</Label>
                  <p className="text-[10px] text-gray-500">Members can see each other's spending</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Notify on New Requests</Label>
                  <p className="text-[10px] text-gray-500">Get push notifications for join requests</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            {/* Shared Goals Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-600">Shared Goals</h3>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Household Expenses</h4>
                    <p className="text-xs text-muted-foreground">Split 50:50</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Emergency Fund</h4>
                    <p className="text-xs text-muted-foreground">Target: ₹5 Lakh</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileShell>
  );
}
