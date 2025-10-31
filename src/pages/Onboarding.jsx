import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Target, Home, TrendingUp } from "lucide-react";

const STEPS = [
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
    goal: "",
    location: "",
    level: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Se já tem objetivo configurado, redireciona para Home
        if (currentUser.fitness_goal) {
          navigate(createPageUrl("Home"));
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
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await base44.auth.updateMe({
        fitness_goal: answers.goal,
        training_location: answers.location,
        fitness_level: answers.level,
      });
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error saving onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = answers[currentStepData.id] !== "";

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Progress Bar */}
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

      {/* Content */}
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
                  Escolha a opção que melhor descreve você
                </p>
              </div>

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

              <Button
                onClick={handleNext}
                disabled={!canProceed || isLoading}
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