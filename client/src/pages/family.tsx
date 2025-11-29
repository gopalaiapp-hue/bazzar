import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Share2, Shield, Plus, Edit2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Family() {
  const { toast } = useToast();
  const [members, setMembers] = useState([
    { id: 1, name: "You", role: "Primary", phone: "+919876543210" }
  ]);
  const [formData, setFormData] = useState({ name: "", phone: "", role: "Family" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAddMember = () => {
    if (!formData.name || !formData.phone) {
      toast({ title: "Required", description: "Fill all fields", variant: "destructive" });
      return;
    }
    
    if (editingId) {
      setMembers(members.map(m => m.id === editingId ? { ...m, ...formData } : m));
      toast({ title: "Updated", description: "Family member updated" });
      setEditingId(null);
    } else {
      setMembers([...members, { id: Date.now(), ...formData }]);
      toast({ title: "Added", description: "Family member added" });
    }
    
    setFormData({ name: "", phone: "", role: "Family" });
  };

  const handleEditMember = (member: any) => {
    setFormData(member);
    setEditingId(member.id);
  };

  const handleDeleteMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
    toast({ title: "Deleted", description: "Family member removed" });
  };

  return (
    <MobileShell>
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-heading font-bold">Family Vault</h1>
            <p className="text-muted-foreground text-sm">Manage shared expenses</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setFormData({ name: "", phone: "", role: "Family" }); setEditingId(null); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Member" : "Add Family Member"}</DialogTitle>
                <DialogDescription>Add a family member to share expenses</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name</Label>
                  <Input placeholder="e.g. Priya" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input placeholder="+919876543210" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <select className="w-full px-3 py-2 border rounded-lg" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option>Spouse</option>
                    <option>Parent</option>
                    <option>Child</option>
                    <option>Sibling</option>
                    <option>Family</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setFormData({ name: "", phone: "", role: "Family" }); setEditingId(null); }}>Cancel</Button>
                <Button onClick={handleAddMember}>{editingId ? "Update" : "Add"} Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Family Members */}
        <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Members ({members.length})</h3>
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role} • {member.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEditMember(member)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteMember(member.id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </section>

        {/* Shared Pockets */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Shared Goals</h3>
          
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
        </section>
      </div>
    </MobileShell>
  );
}
