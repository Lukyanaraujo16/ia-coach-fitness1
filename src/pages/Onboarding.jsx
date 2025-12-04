import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Target, TrendingUp, User as UserIcon, Users } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

const STEPS = [
  {
    id: "personal_info",
    title: "Informações",
    icon: UserIcon,
    type: "form",
  },
  {
    id: "gender",
    title: "Qual seu gênero?",
    icon: Users,
    options: [
      { value: "male", label: "Masculino", emoji: "👨" },
      { value: "female", label: "Feminino", emoji: "👩" },
      { value: "other", label: "Outro", emoji: "🧑" },
    ],
  },
  {
    id: "goal",
    title: "Qual seu objetivo?",
    icon: Target,
    options: [
      { value: "lose_weight", label: "Emagrecer", emoji: "🔥" },
      { value: "gain_muscle", label: "Ganhar Massa", emoji: "💪" },
      { value: "maintain", label: "Manter Forma", emoji: "⚡" },
    ],
  },
  {
    id: "level",
    title: "Qual seu nível?",
    icon: TrendingUp,
    options: [
      { value: "beginner", label: "Iniciante", emoji: "🌱" },
      { value: "intermediate", label: "Intermediário", emoji: "🚀" },
      { value: "advanced", label: "Avançado", emoji: "🏆" },
    ],
  },
  {
    id: "observations",
    title: "Observações para seu treino",
    icon: AlertCircle,
    type: "observations",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    nome_completo: "",
    current_weight: "",
    height: "",
    weight_goal: "",
    weekly_goal: "3",
    gender: "",
    goal: "",
    level: "",
    workout_observations: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.nome_completo) {
          setAnswers(prev => ({ ...prev, nome_completo: currentUser.nome_completo }));
        }
        
        if (currentUser.onboarding_completed) {
          if (!currentUser.nutrition_setup_completed) {
            navigate(createPageUrl("NutritionSetup"));
          } else if (!currentUser.workout_setup_completed) {
            navigate(createPageUrl("WorkoutSetup"));
          } else {
            navigate(createPageUrl("Dashboard"));
          }
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Onboarding"));
      }
    };
    loadUser();
  }, [navigate]);

  const currentStepData = STEPS[currentStep];
  const Icon = currentStepData.icon;

  const handleSelect = (value) => {
    setAnswers({ ...answers, [currentStepData.id]: value });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete(false);
    }
  };

  const handleComplete = async (skipSetup) => {
    setIsLoading(true);
    try {
      // Calcular datas do trial (3 dias)
      const trialStartDate = new Date().toISOString();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 3);
      
      await base44.auth.updateMe({
        nome_completo: answers.nome_completo.trim(),
        current_weight: answers.current_weight ? parseFloat(answers.current_weight) : undefined,
        height: answers.height ? parseFloat(answers.height) : undefined,
        weight_goal: answers.weight_goal ? parseFloat(answers.weight_goal) : undefined,
        weekly_goal: parseInt(answers.weekly_goal),
        gender: answers.gender,
        fitness_goal: answers.goal,
        training_location: "gym",
        fitness_level: answers.level,
        workout_observations: answers.workout_observations || "",
        onboarding_completed: true,
        nutrition_setup_completed: skipSetup,
        workout_setup_completed: skipSetup,
        // Iniciar trial premium de 3 dias
        subscription_status: "trial",
        premium_trial_start_date: trialStartDate,
        premium_trial_end_date: trialEndDate.toISOString(),
        has_had_trial: true,
      });
      
      // Sincronizar UserProfile para o agente WhatsApp
      try {
        await base44.functions.invoke('syncUserProfile');
      } catch (e) {
        console.error('Erro ao sincronizar UserProfile:', e);
      }
      
      if (skipSetup) {
        navigate(createPageUrl("Dashboard"));
      } else {
        navigate(createPageUrl("NutritionSetup"));
      }
    } catch (error) {
      console.error("Error saving onboarding:", error);
      alert("Erro ao salvar suas informações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStepData.type === "form") {
      return answers.nome_completo.trim() && answers.current_weight && answers.height && answers.weight_goal && answers.weekly_goal;
    }
    if (currentStepData.type === "observations") {
      return true; // Observações são opcionais
    }
    return answers[currentStepData.id] !== "";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mb-6">
        <div className="flex gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                index <= currentStep ? "bg-blue-600" : "bg-slate-800"
              }`}
            />
          ))}
        </div>
        <p className="text-slate-400 text-xs text-center mt-2">
          Passo {currentStep + 1} de {STEPS.length}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-7 h-7 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {currentStepData.title}
                </h2>
                <p className="text-slate-400 text-sm">
                  {currentStepData.type === "form" 
                    ? "Preencha seus dados"
                    : "Escolha uma opção"}
                </p>
              </div>

              {currentStepData.type === "form" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">Nome Completo *</Label>
                    <Input
                      value={answers.nome_completo}
                      onChange={(e) => setAnswers({ ...answers, nome_completo: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white h-11"
                      placeholder="Digite seu nome"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Peso (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={answers.current_weight}
                        onChange={(e) => setAnswers({ ...answers, current_weight: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white h-11"
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Altura (cm) *</Label>
                      <Input
                        type="number"
                        value={answers.height}
                        onChange={(e) => setAnswers({ ...answers, height: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white h-11"
                        placeholder="175"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">Meta de Peso (kg) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={answers.weight_goal}
                      onChange={(e) => setAnswers({ ...answers, weight_goal: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white h-11"
                      placeholder="65"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">Treinos por Semana *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={answers.weekly_goal}
                      onChange={(e) => setAnswers({ ...answers, weekly_goal: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white h-11"
                      placeholder="3"
                    />
                  </div>
                </div>
              ) : currentStepData.type === "observations" ? (
                <div className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">
                      💡 Informe qualquer observação importante para a IA criar seu treino ideal:
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-slate-300 text-sm font-medium mb-1">🏥 Limitações físicas ou lesões?</p>
                      <p className="text-slate-500 text-xs">Ex: Tenho problema no ombro, não posso fazer supino...</p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-slate-300 text-sm font-medium mb-1">🎯 Quer focar em alguma região?</p>
                      <p className="text-slate-500 text-xs">Ex: Quero focar mais em pernas e glúteos...</p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-slate-300 text-sm font-medium mb-1">⚠️ Algum exercício que não pode fazer?</p>
                      <p className="text-slate-500 text-xs">Ex: Não consigo fazer agachamento livre...</p>
                    </div>
                  </div>
                  
                  <Textarea
                    value={answers.workout_observations}
                    onChange={(e) => setAnswers({ ...answers, workout_observations: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                    placeholder="Escreva suas observações aqui... (opcional)"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {currentStepData.options.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                        answers[currentStepData.id] === option.value
                          ? "border-blue-600 bg-blue-600/20"
                          : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="text-white font-medium text-sm">{option.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-2">
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
                >
                  {isLoading ? (
                    "Salvando..."
                  ) : currentStep === STEPS.length - 1 ? (
                    <>
                      Começar
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                
                {currentStep === STEPS.length - 1 && (
                  <Button
                    onClick={() => handleComplete(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 h-12 text-base"
                  >
                    Pular e Configurar Depois
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}