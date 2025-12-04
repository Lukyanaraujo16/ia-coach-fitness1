import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Dumbbell, TrendingUp, Zap, Target, Clock, Info } from "lucide-react";
import { motion } from "framer-motion";

const techniquesInfo = {
  feeder_set: {
    name: "Feeder Set",
    icon: "🎯",
    description: "Séries de reconhecimento de carga. Servem para preparar o músculo e avaliar se você consegue progredir carga hoje.",
    howTo: "Faça poucas repetições, bem longe da falha. Observe como está se sentindo para decidir a carga das séries principais."
  },
  working_set: {
    name: "Working Set",
    icon: "💪",
    description: "Séries principais de trabalho. Aqui você progride carga semanalmente.",
    howTo: "4 a 9 repetições. Deixe 1-2 reps na reserva se tiver mais de uma série."
  },
  back_off_set: {
    name: "Back Off Set",
    icon: "⬇️",
    description: "Série com 20% menos carga que o working set, focando em mais repetições.",
    howTo: "10 a 15 repetições. Realize após as séries de trabalho."
  },
  cluster_set: {
    name: "Cluster Set",
    icon: "🔗",
    description: "Séries divididas em blocos com micro-descansos.",
    howTo: "Mesma carga do working set. Faça 3 reps, descanse 10s, repita até 12-15 reps totais."
  },
  muscle_round: {
    name: "Muscle Round",
    icon: "🔄",
    description: "Técnica de alto volume com blocos e descansos curtos.",
    howTo: "24 reps totais: 4 reps, 10s descanso, repita 6 vezes."
  },
  top_set: {
    name: "Top Set",
    icon: "🏆",
    description: "Série pesada com ~80% do 1RM. Use apenas em dias muito bons.",
    howTo: "2 a 4 repetições com carga alta. Só faça se estiver bem alimentado e descansado."
  },
  drop_set: {
    name: "Drop Set",
    icon: "🔥",
    description: "Série até a falha, reduz carga e repete.",
    howTo: "Vá até a falha, reduza 20-30% da carga, repita até a falha. Faça isso 2-3 vezes."
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
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg my-8"
      >
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-700/50">
          <CardContent className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Técnicas do Treino</h2>
                  <p className="text-blue-400 text-sm font-medium">
                    Nível: {levelLabels[userLevel] || "Intermediário"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
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
                <h3 className="text-green-400 font-semibold">Progressão de Carga</h3>
              </div>
              <p className="text-slate-300 text-sm">
                Tente aumentar carga ou repetições toda semana. Se não conseguir, mantenha a carga e melhore a execução. Use as Feeder Sets para avaliar se é um bom dia para progredir.
              </p>
            </div>

            {/* Techniques */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Técnicas Utilizadas Hoje
              </h3>
              
              {allTechniques.map((techKey) => {
                const tech = techniquesInfo[techKey];
                if (!tech) return null;
                
                return (
                  <div
                    key={techKey}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{tech.icon}</span>
                      <h4 className="text-white font-medium">{tech.name}</h4>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{tech.description}</p>
                    <div className="bg-slate-900/50 rounded p-2">
                      <p className="text-blue-300 text-xs">
                        <strong>Como fazer:</strong> {tech.howTo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Descanso */}
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-purple-400 font-semibold text-sm">Intervalos de Descanso</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-300">
                  <span className="text-purple-300">Feeder Sets:</span> 1-2 min
                </div>
                <div className="text-slate-300">
                  <span className="text-purple-300">Músculo pequeno:</span> 2-3 min
                </div>
                <div className="text-slate-300">
                  <span className="text-purple-300">Músculo grande:</span> 3-5 min
                </div>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 font-bold"
            >
              Entendi, Vamos Treinar! 💪
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}