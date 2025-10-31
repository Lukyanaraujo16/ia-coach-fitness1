import React from "react";
import { motion } from "framer-motion";

const colorMap = {
  blue: "from-blue-600 to-blue-700",
  orange: "from-orange-500 to-orange-600",
  yellow: "from-yellow-500 to-yellow-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
};

export default function StatsCard({ icon: Icon, label, value, suffix, color = "blue" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all duration-300"
    >
      <div className={`w-10 h-10 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        {suffix && <p className="text-sm text-slate-500">{suffix}</p>}
      </div>
    </motion.div>
  );
}