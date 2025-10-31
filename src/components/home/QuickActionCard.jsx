import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const colorMap = {
  blue: "from-blue-600/20 to-blue-700/20 border-blue-600/30",
  purple: "from-purple-600/20 to-purple-700/20 border-purple-600/30",
  orange: "from-orange-600/20 to-orange-700/20 border-orange-600/30",
};

const iconColorMap = {
  blue: "text-blue-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
};

export default function QuickActionCard({ icon: Icon, title, subtitle, link, color = "blue" }) {
  if (!Icon || !link) return null;
  
  return (
    <Link to={link}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-gradient-to-br ${colorMap[color]} backdrop-blur-sm border rounded-2xl p-4 hover:shadow-xl transition-all duration-300`}
      >
        <Icon className={`w-8 h-8 ${iconColorMap[color]} mb-3`} />
        <h4 className="text-white font-semibold mb-1">{title}</h4>
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">{subtitle}</p>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>
      </motion.div>
    </Link>
  );
}