import { Wallet, Building2, Smartphone, Briefcase, PiggyBank, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

export interface PocketProps {
  id: string;
  name: string;
  type: "cash" | "bank" | "upi" | "salary" | "savings" | "family";
  amount: number;
  icon?: any;
  color?: string;
}

export function PocketCard({ name, type, amount, color = "bg-blue-500" }: PocketProps) {
  const getIcon = () => {
    switch (type) {
      case "cash": return <Wallet className="w-5 h-5 text-white" />;
      case "bank": return <Building2 className="w-5 h-5 text-white" />;
      case "upi": return <Smartphone className="w-5 h-5 text-white" />;
      case "salary": return <Briefcase className="w-5 h-5 text-white" />;
      case "savings": return <PiggyBank className="w-5 h-5 text-white" />;
      default: return <Wallet className="w-5 h-5 text-white" />;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${color}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${color}`}>
          {getIcon()}
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <ArrowRightLeft className="w-4 h-4" />
        </button>
      </div>

      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{name}</p>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">{formatCurrency(amount)}</h3>
      </div>
    </motion.div>
  );
}
