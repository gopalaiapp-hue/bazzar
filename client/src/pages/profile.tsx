import React, { useState } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  User, Settings, CreditCard, Users, Bell, Lock, 
  Smartphone, Download, Share2, HelpCircle, LogOut, 
  ChevronRight, Trash2, Shield, Moon, Sun, Palette,
  FileText, Database, AlertTriangle, EyeOff, Clock,
  Globe, MessageCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [isHiddenPockets, setIsHiddenPockets] = useState(false);
  const [language, setLanguage] = useState("English");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [banks, setBanks] = useState([
    { id: 1, name: "HDFC Bank", upi: "arjun@hdfc", type: "Bank" },
    { id: 2, name: "PhonePe", upi: "arjun.kumar@phonepe", type: "UPI" }
  ]);
  const [bankForm, setBankForm] = useState({ name: "", upi: "", type: "Bank" });
  const [editingBankId, setEditingBankId] = useState<number | null>(null);

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your data is being prepared. Download will start shortly.",
    });
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Date,Merchant,Amount,Category\n2025-11-29,Zomato,450,Food\n2025-11-29,Uber,230,Transport');
      link.download = 'Arjun_2025_Full_Report.csv';
      link.click();
    }, 1500);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm === "DELETE") {
      toast({
        title: "Account Deleted",
        description: "Your account has been scheduled for permanent deletion.",
        variant: "destructive"
      });
    } else {
       toast({
        title: "Confirmation Failed",
        description: "Please type DELETE to confirm.",
        variant: "destructive"
      });
    }
  };

  const handleSOS = () => {
     toast({
      title: "SOS Sent",
      description: "Live location and last 5 transactions sent to emergency contacts via WhatsApp.",
      variant: "destructive"
    });
     window.open(`https://wa.me/?text=EMERGENCY! Tracking link: maps.google.com/?q=19.0760,72.8777 | Last spend: ₹450 Zomato`, '_blank');
  };

  const handleSupport = () => {
    window.open("https://wa.me/919999999999?text=Hi BazaarBudget Support, I need help with...", "_blank");
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleAddBank = () => {
    if (!bankForm.name || !bankForm.upi) {
      toast({ title: "Required", description: "Fill all fields", variant: "destructive" });
      return;
    }
    
    if (editingBankId) {
      setBanks(banks.map(b => b.id === editingBankId ? { ...b, ...bankForm } : b));
      toast({ title: "Updated", description: "Bank details updated" });
      setEditingBankId(null);
    } else {
      setBanks([...banks, { id: Date.now(), ...bankForm }]);
      toast({ title: "Added", description: "Bank account added" });
    }
    
    setBankForm({ name: "", upi: "", type: "Bank" });
  };

  const handleEditBank = (bank: any) => {
    setBankForm(bank);
    setEditingBankId(bank.id);
  };

  const handleDeleteBank = (id: number) => {
    setBanks(banks.filter(b => b.id !== id));
    toast({ title: "Deleted", description: "Bank account removed" });
  };

  return (
    <MobileShell>
      <div className="pb-8">
        {/* Header Profile Card */}
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Arjun Kumar</h1>
              <p className="text-muted-foreground text-sm">+91 98765 43210</p>
              <div className="flex gap-2 mt-2">
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Family Head</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-xl p-4 flex justify-between items-center shadow-lg shadow-gray-200">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Total Net Worth</p>
              <h2 className="text-2xl font-bold">₹ 52,84,310</h2>
            </div>
            <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-6">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
             <div onClick={handleExport} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
                <Download className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-bold text-center">Export Data</span>
             </div>
             <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-200 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg text-green-800">₹200</div>
                <Share2 className="w-6 h-6 text-green-600" />
                <span className="text-xs font-bold text-center text-green-800">Refer & Earn</span>
             </div>
          </div>

          {/* Accounts & Cards */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Accounts & Cards</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-3 p-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">Banks & UPI ({banks.length})</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100" onClick={() => { setBankForm({ name: "", upi: "", type: "Bank" }); setEditingBankId(null); }}>+ Add</button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBankId ? "Edit Bank" : "Add Bank / UPI"}</DialogTitle>
                      <DialogDescription>Link your bank account or UPI for payments</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Account Type</Label>
                        <select className="w-full px-3 py-2 border rounded-lg" value={bankForm.type} onChange={(e) => setBankForm({...bankForm, type: e.target.value})}>
                          <option>Bank</option>
                          <option>UPI</option>
                          <option>Card</option>
                        </select>
                      </div>
                      <div>
                        <Label>Bank / Service Name</Label>
                        <Input placeholder="e.g. HDFC, PhonePe" value={bankForm.name} onChange={(e) => setBankForm({...bankForm, name: e.target.value})} />
                      </div>
                      <div>
                        <Label>Account Number / UPI ID</Label>
                        <Input placeholder="e.g. arjun@hdfc" value={bankForm.upi} onChange={(e) => setBankForm({...bankForm, upi: e.target.value})} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setBankForm({ name: "", upi: "", type: "Bank" }); setEditingBankId(null); }}>Cancel</Button>
                      <Button onClick={handleAddBank}>{editingBankId ? "Update" : "Add"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {banks.map(bank => (
                <div key={bank.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-bold">{bank.name}</p>
                    <p className="text-xs text-muted-foreground">{bank.type} • {bank.upi}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditBank(bank)} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Edit</button>
                    <button onClick={() => handleDeleteBank(bank.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Family & Safety */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Family & Safety</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MenuItem icon={Users} label="Family Members" sublabel="Edit income, Roles" />
              <Separator />
              <Dialog>
                <DialogTrigger asChild>
                   <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Add Nominee</p>
                          <p className="text-xs text-muted-foreground">For Family Vault</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                   </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Nominee</DialogTitle>
                    <DialogDescription>Ensure your family vault is accessible to your loved ones.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nominee Name</Label>
                      <Input placeholder="e.g. Priya Kumar" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input placeholder="+91" type="tel" />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input placeholder="Spouse, Parent, etc." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => toast({ title: "Nominee Added", description: "Details saved securely." })}>Save Nominee</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Separator />
              <MenuItem icon={Smartphone} label="Language" sublabel={language} />
              <Separator />
              <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Logout</p>
                    <p className="text-xs text-red-500">Sign out from app</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-300" />
              </div>
              <Separator />
              <div onClick={handleSOS} className="flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">Emergency SOS Share</p>
                    <p className="text-xs text-red-500">Live location + Recent spend</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-300" />
              </div>
            </div>
          </section>

          {/* App Settings */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">App Settings</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MenuItem icon={Clock} label="Daily Brief Time" sublabel="8:00 PM • Quiet Hours" />
              <Separator />
              <MenuItem icon={Bell} label="Notification Preferences" sublabel="Spending alerts, Goals" />
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">App Lock</p>
                    <p className="text-xs text-muted-foreground">Fingerprint / PIN</p>
                  </div>
                </div>
                <Switch checked={isAppLocked} onCheckedChange={setIsAppLocked} />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Hide Sensitive Pockets</p>
                    <p className="text-xs text-muted-foreground">Hide from family view</p>
                  </div>
                </div>
                <Switch checked={isHiddenPockets} onCheckedChange={setIsHiddenPockets} />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Lite Mode</p>
                    <p className="text-xs text-muted-foreground">Big fonts for parents</p>
                  </div>
                </div>
                <Switch checked={isLiteMode} onCheckedChange={setIsLiteMode} />
              </div>
              <Separator />
              <MenuItem icon={Palette} label="Theme & Accent" sublabel="Light • Kesari Orange" />
              <Separator />
              <MenuItem icon={Globe} label="Language" sublabel="English (Change to Hindi)" />
            </div>
          </section>

          {/* Backup & Security */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Backup & Security</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Auto Backup</p>
                    <p className="text-xs text-muted-foreground">Google Drive (Weekly)</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
               <Separator />
               <Dialog>
                <DialogTrigger asChild>
                   <div className="flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-600">Delete Account</p>
                        <p className="text-xs text-red-400">Permanently remove all data</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-300" />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Delete Account Permanently?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Type "DELETE" to confirm</Label>
                      <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE"}>Delete Permanently</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          {/* Support & Logout */}
          <section className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div onClick={handleSupport} className="flex items-center justify-between p-4 hover:bg-green-50 active:bg-green-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">WhatsApp Support</p>
                    <p className="text-xs text-muted-foreground">Replies in &lt;5 mins</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
              <Separator />
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center group-hover:bg-gray-100">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Logout</p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="pt-4 text-center pb-20">
              <p className="text-[10px] text-gray-400 mt-2">BazaarBudget v1.0.0 (Beta)</p>
              <p className="text-[10px] text-gray-300">Made with ❤️ in India</p>
            </div>
          </section>
        </div>
      </div>
    </MobileShell>
  );
}

function MenuItem({ icon: Icon, label, sublabel, onClick }: any) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </div>
  );
}
