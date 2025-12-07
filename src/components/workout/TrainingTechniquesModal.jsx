import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Dumbbell, TrendingUp, Zap, Target, Clock, Info } from "lucide-react";
import { motion } from "framer-motion";

const techniquesInfo = {
  feeder_set: {
    name: "Feeder Set",
    icon: "🎯",
    description: "Séries de reconhecimento de carga. Preparam o músculo para a carga real de trabalho.",
    howTo: "Poucas repetições, bem longe da falha. Ex: 1ª feeder 20kg (9 reps), 2ª feeder 30kg (6 reps), 3ª feeder 40kg (4 reps). Avalie como está se sentindo para decidir a carga das séries principais.",
    progression: "Não progride carga nas feeders. Elas servem apenas como aquecimento e reconhecimento."
  },
  working_set: {
    name: "Working Set",
    icon: "💪",
    description: "Séries principais de trabalho. Aqui você progride carga semanalmente.",
    howTo: "4 a 9 repetições por série. Se for mais de 1 working set, deixe 1-2 reps na reserva para não perder eficiência nas seguintes.",
    progression: "⬆️ PROGRESSÃO: Tente aumentar carga ou repetições toda semana. Se não conseguir, mantenha a carga e melhore a execução."
  },
  back_off_set: {
    name: "Back Off Set",
    icon: "⬇️",
    description: "Séries com 20% menos carga que o working set, focando em mais repetições e volume.",
    howTo: "10 a 15 repetições. Realize após as working sets. Ex: se usou 50kg no working, use 40kg no back off.",
    progression: "Progride proporcionalmente ao working set (sempre -20% da carga)."
  },
  cluster_set: {
    name: "Cluster Set",
    icon: "🔗",
    description: "Séries divididas em blocos de 3 reps com 10s de descanso entre eles.",
    howTo: "Mesma carga do working set. Faça 3 reps → descanse 10s → 3 reps → descanse 10s → repita até completar 12-15 reps totais.",
    progression: "Progride carga semanalmente como no working set."
  },
  muscle_round: {
    name: "Muscle Round",
    icon: "🔄",
    description: "Técnica avançada de alto volume: 24 repetições totais divididas em 6 blocos.",
    howTo: "Faça 4 reps → descanse 10s → 4 reps → descanse 10s → repita 6 vezes (total 24 reps).",
    progression: "Aumente a carga quando conseguir completar todas as 24 reps com boa técnica."
  },
  top_set: {
    name: "Top Set",
    icon: "🏆",
    description: "Série pesada com ~80% do 1RM. Use apenas em dias muito propícios.",
    howTo: "2 a 4 repetições com carga alta. Só faça se estiver bem alimentado, descansado e as feeders/workings estiverem excelentes.",
    progression: "Progride com cautela. Ideal para períodos de off-season com suporte calórico maior."
  },
  drop_set: {
    name: "Drop Set",
    icon: "🔥",
    description: "Técnica avançada: executar até a falha, reduzir peso e continuar sem descanso.",
    howTo: "Comece com carga do working set → vá até a falha → reduza 10-30% imediatamente → continue até nova falha → repita 2-3 vezes.",
    progression: "Progrida aumentando a carga inicial ou reduzindo menos peso nas quedas."
  }
};

export default function TrainingTechniquesModal({ techniques = [], userLevel, onClose }) {
  const levelLabels = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado"
  };

  const levelDescriptions = {
    beginner: "Foco em aprender os movimentos e criar consistência. Técnicas simples e eficazes.",
    intermediate: "Aumento de intensidade com técnicas moderadas para progressão contínua.",
    advanced: "Técnicas avançadas para maximizar ganhos e quebrar platôs."
  };

  // Sempre incluir feeder_set e working_set
  const allTechniques = ["feeder_set", "working_set", ...techniques.filter(t => t !== "feeder_set" && t !== "working_set")];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] overflow-y-auto"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg mx-auto px-4 py-6 min-h-full"
      >
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-700/50">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Técnicas do Treino</h2>
                  <p className="text-blue-400 text-xs sm:text-sm font-medium">
                    Nível: {levelLabels[userLevel] || "Intermediário"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white flex-shrink-0 h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Level Description */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
              <p className="text-blue-200 text-sm">
                {levelDescriptions[userLevel] || levelDescriptions.intermediate}
              </p>
            </div>

            {/* Progressão de Carga */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-green-400 font-semibold">⬆️ Progressão de Carga</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <strong>Todo exercício deve progredir carga em cada série!</strong> Tente aumentar carga ou repetições toda semana nas working sets. Se não conseguir progredir, mantenha a carga e foque em melhorar a execução. Use as Feeder Sets para avaliar se é um bom dia para aumentar a carga.
              </p>
            </div>

            {/* Techniques */}
            <div className="space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Zap className="w-4 h-4 text-yellow-400" />
                Técnicas Utilizadas Hoje
              </h3>
              
              {allTechniques.map((techKey) => {
                const tech = techniquesInfo[techKey];
                if (!tech) return null;
                
                return (
                  <div
                    key={techKey}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 sm:p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{tech.icon}</span>
                      <h4 className="text-white font-medium text-sm">{tech.name}</h4>
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{tech.description}</p>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-blue-300 text-xs leading-relaxed">
                        <strong>Como fazer:</strong> {tech.howTo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Descanso */}
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-purple-400 font-semibold text-xs sm:text-sm">Intervalos de Descanso</h3>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <div className="text-slate-300 text-center">
                  <span className="text-purple-300 block">Feeder</span> 1-2min
                </div>
                <div className="text-slate-300 text-center">
                  <span className="text-purple-300 block">Peq.</span> 2-3min
                </div>
                <div className="text-slate-300 text-center">
                  <span className="text-purple-300 block">Grande</span> 3-5min
                </div>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 sm:h-14 font-bold text-sm sm:text-base"
            >
              Entendi, Vamos Treinar! 💪
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}