
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Target, Home, TrendingUp, User as UserIcon, Users } from "lucide-react";

const STEPS = [
  {
    id: "personal_info",
    title: "Suas Informações",
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
    id: "location",
    title: "Onde você treina?",
    icon: Home,
    options: [
      { value: "gym", label: "Academia", emoji: "🏋️" },
      { value: "home", label: "Em Casa", emoji: "🏠" },
      { value: "both", label: "Ambos", emoji: "🔄" },
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
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    full_name: "",
    current_weight: "",
    height: "",
    weight_goal: "",
    weekly_goal: "3",
    gender: "",
    goal: "",
    location: "",
    level: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [checkedUser, setCheckedUser] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Se já tem nome, usa como padrão mas ainda permite editar
        if (currentUser.full_name) {
          setAnswers(prev => ({ ...prev, full_name: currentUser.full_name }));
        }
        
        // Só redireciona se já completou onboarding E ainda não checou
        if (currentUser.fitness_goal && !checkedUser) {
          setCheckedUser(true);
          navigate(createPageUrl("Home"), { replace: true });
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Onboarding"));
      }
    };
    
    if (!checkedUser) {
      loadUser();
    }
  }, []); // Array vazio - só executa uma vez

  const currentStepData = STEPS[currentStep];
  const Icon = currentStepData.icon;

  const handleSelect = (value) => {
    setAnswers({ ...answers, [currentStepData.id]: value });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await base44.auth.updateMe({
        full_name: answers.full_name.trim(),
        current_weight: answers.current_weight ? parseFloat(answers.current_weight) : undefined,
        height: answers.height ? parseFloat(answers.height) : undefined,
        weight_goal: answers.weight_goal ? parseFloat(answers.weight_goal) : undefined,
        weekly_goal: parseInt(answers.weekly_goal),
        gender: answers.gender,
        fitness_goal: answers.goal,
        training_location: answers.location,
        fitness_level: answers.level,
      });
      navigate(createPageUrl("WorkoutSelection"));
    } catch (error) {
      console.error("Error saving onboarding:", error);
      alert("Erro ao salvar suas informações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStepData.type === "form") {
      return answers.full_name.trim() && answers.current_weight && answers.height && answers.weight_goal && answers.weekly_goal;
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md mb-8">
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
        <p className="text-slate-400 text-sm text-center mt-3">
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
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentStepData.title}
                </h2>
                <p className="text-slate-400">
                  {currentStepData.type === "form" 
                    ? "Preencha seus dados para personalizar sua experiência"
                    : "Escolha a opção que melhor descreve você"}
                </p>
              </div>

              {currentStepData.type === "form" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nome Completo *</Label>
                    <Input
                      value={answers.full_name}
                      onChange={(e) => setAnswers({ ...answers, full_name: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Digite seu nome completo"
                    />
                    <p className="text-slate-500 text-xs">
                      Este será o nome exibido no app
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Peso Atual (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={answers.current_weight}
                        onChange={(e) => setAnswers({ ...answers, current_weight: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Altura (cm) *</Label>
                      <Input
                        type="number"
                        value={answers.height}
                        onChange={(e) => setAnswers({ ...answers, height: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="175"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Meta de Peso (kg) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={answers.weight_goal}
                      onChange={(e) => setAnswers({ ...answers, weight_goal: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="65"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Meta Semanal de Treinos *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={answers.weekly_goal}
                      onChange={(e) => setAnswers({ ...answers, weekly_goal: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="3"
                    />
                    <p className="text-slate-500 text-xs">
                      Quantos dias por semana você quer treinar?
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentStepData.options.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                        answers[currentStepData.id] === option.value
                          ? "border-blue-600 bg-blue-600/20"
                          : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{option.emoji}</span>
                        <span className="text-white font-medium">{option.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              >
                {isLoading ? (
                  "Salvando..."
                ) : currentStep === STEPS.length - 1 ? (
                  "Concluir"
                ) : (
                  <>
                    Continuar
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
