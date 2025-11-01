
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Target, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useState } from "react";
import AIDietWizard from "./AIDietWizard";

const goalIcons = {
  lose_weight: "🔥",
  gain_muscle: "💪",
  maintain: "⚖️",
  performance: "⚡",
};

const goalLabels = {
  lose_weight: "Emagrecer",
  gain_muscle: "Ganhar Massa",
  maintain: "Manter Forma",
  performance: "Performance",
};

export default function NutritionPlans({ plans = [], user }) {
  const [showAIWizard, setShowAIWizard] = useState(false);
  const isPremium = user?.subscription_status === 'premium';

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-800/50">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Planos Alimentares Personalizados
          </h3>
          <p className="text-slate-300 text-sm mb-4">
            Escolha um plano de acordo com seu objetivo fitness e siga as recomendações para alcançar seus resultados! 🎯
          </p>
          
          <Button
            onClick={() => setShowAIWizard(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            <Zap className="w-4 h-4 mr-2" />
            Criar Minha Dieta Personalizada com IA
          </Button>
        </CardContent>
      </Card>

      {plans.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Nenhum plano disponível ainda</p>
            <p className="text-slate-500 text-sm">
              Os planos alimentares serão adicionados em breve!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isLocked = plan.is_premium && !isPremium;
            const proteinG = Math.round((plan.daily_calories * (plan.macros_distribution?.protein_percentage || 30) / 100) / 4);
            const carbsG = Math.round((plan.daily_calories * (plan.macros_distribution?.carbs_percentage || 40) / 100) / 4);
            const fatG = Math.round((plan.daily_calories * (plan.macros_distribution?.fat_percentage || 30) / 100) / 9);

            return (
              <Card
                key={plan.id}
                className={`border-slate-800 ${
                  isLocked ? 'bg-slate-900/30' : 'bg-slate-900/50'
                } relative overflow-hidden`}
              >
                {isLocked && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                      <p className="text-white font-semibold">Premium</p>
                    </div>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{goalIcons[plan.goal]}</span>
                        <CardTitle className="text-white">{plan.title}</CardTitle>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 mb-2">
                        {goalLabels[plan.goal]}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Daily Calories */}
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-400">
                      {plan.daily_calories}
                    </p>
                    <p className="text-slate-500 text-sm">kcal/dia</p>
                  </div>

                  {/* Macros Distribution */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <p className="text-blue-400 font-bold">{proteinG}g</p>
                      <p className="text-slate-500 text-xs">Proteína</p>
                    </div>
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <p className="text-orange-400 font-bold">{carbsG}g</p>
                      <p className="text-slate-500 text-xs">Carbos</p>
                    </div>
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <p className="text-yellow-400 font-bold">{fatG}g</p>
                      <p className="text-slate-500 text-xs">Gorduras</p>
                    </div>
                  </div>

                  {/* Meals */}
                  {plan.meals && plan.meals.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs mb-2">Refeições Sugeridas:</p>
                      <div className="space-y-2">
                        {plan.meals.slice(0, 3).map((meal, idx) => (
                          <div key={idx} className="text-sm text-slate-300">
                            • {meal.time} - {meal.meal_type}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  {isLocked ? (
                    <Link to={createPageUrl("Subscription")}>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
                        <Lock className="w-4 h-4 mr-2" />
                        Desbloquear com Premium
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-green-700 text-green-400 hover:bg-green-900/30"
                    >
                      Ver Detalhes Completos
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAIWizard && (
        <AIDietWizard user={user} onClose={() => setShowAIWizard(false)} />
      )}
    </div>
  );
}
