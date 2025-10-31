import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, LogOut, User, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfileStats from "../components/profile/ProfileStats";
import ProfileInfo from "../components/profile/ProfileInfo";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const isPremium = user?.subscription_status === 'premium';

  return (
    <div className="py-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-800 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.full_name || 'Carregando...'}
              </h2>
              <p className="text-slate-400 mb-3">{user?.email}</p>
              <div className="flex flex-wrap gap-2">
                {isPremium ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">Premium</span>
                  </div>
                ) : (
                  <Link to={createPageUrl("Subscription")}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Premium
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <ProfileStats user={user} />

      {/* Profile Info */}
      <ProfileInfo user={user} setUser={setUser} />

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start border-slate-800 text-slate-300 hover:bg-slate-800"
        >
          <Settings className="w-5 h-5 mr-3" />
          Configurações
        </Button>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start border-red-900/50 text-red-400 hover:bg-red-950/50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}