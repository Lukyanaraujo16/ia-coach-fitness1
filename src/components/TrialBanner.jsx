import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Clock } from "lucide-react";

export default function TrialBanner({ user }) {
  if (!user || user.subscription_status !== 'trial') return null;

  const trialEndDate = new Date(user.premium_trial_end_date);
  const now = new Date();
  const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return null;

  return (
    <Link to={createPageUrl("Subscription")}>
      <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-700/50 hover:from-yellow-900/60 hover:to-orange-900/60 transition-all cursor-pointer">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-sm">Trial Premium Ativo</h3>
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-yellow-300 text-xs">
                {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'} • Aproveite!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}