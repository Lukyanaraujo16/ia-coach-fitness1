import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertTriangle, 
  Droplets, 
  Coffee, 
  Apple, 
  Heart, 
  Brain, 
  ChevronRight, 
  ChevronLeft,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EDUCATION_SLIDES = [
  {
    id: "intro",
    title: "O que é Jejum Intermitente?",
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    content: `O Jejum Intermitente (JI) é um padrão alimentar que alterna entre períodos de jejum e alimentação.

**Não é uma dieta**, mas sim um estilo de alimentação que define QUANDO você come, não O QUE você come.

Os tipos mais populares são:
• **16:8** - 16h de jejum, 8h para comer
• **18:6** - 18h de jejum, 6h para comer
• **20:4** - 20h de jejum, 4h para comer`,
  },
  {
    id: "benefits",
    title: "Benefícios Comprovados",
    icon: Heart,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    content: `✅ **Perda de gordura** - Seu corpo usa gordura como energia
✅ **Autofagia** - Limpeza celular (após 16h+)
✅ **Clareza mental** - Muitos relatam maior foco
✅ **Controle de insulina** - Melhora sensibilidade
✅ **Praticidade** - Menos refeições para preparar

⚠️ Resultados variam de pessoa para pessoa!`,
  },
  {
    id: "allowed",
    title: "O que PODE durante o jejum?",
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    content: `**Permitido (não quebra o jejum):**

💧 **Água** - Beba bastante! Essencial!
☕ **Café preto** - Sem açúcar ou leite
🍵 **Chá** - Sem açúcar ou mel
💊 **Suplementos** - Maioria é ok (sem calorias)

**A regra geral:** Se tem calorias, quebra o jejum!`,
  },
  {
    id: "notallowed",
    title: "O que NÃO PODE durante o jejum?",
    icon: X,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    content: `**Evite durante o período de jejum:**

❌ Qualquer alimento sólido
❌ Sucos (mesmo naturais)
❌ Refrigerantes (mesmo zero*)
❌ Leite ou bebidas vegetais
❌ Café com açúcar/leite
❌ Chicletes (muitos têm açúcar)
❌ Caldos/sopas

*Alguns estudos sugerem que adoçantes podem afetar a insulina`,
  },
  {
    id: "risks",
    title: "⚠️ Riscos e Contraindicações",
    icon: AlertTriangle,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    content: `**NÃO faça jejum se você:**

🚫 Está grávida ou amamentando
🚫 Tem diabetes (consulte médico)
🚫 Histórico de transtornos alimentares
🚫 Está abaixo do peso
🚫 É menor de 18 anos
🚫 Toma medicamentos com horário fixo

**Efeitos colaterais comuns no início:**
• Dor de cabeça (beba mais água!)
• Irritabilidade
• Fome intensa (passa em 2-3 dias)

**Sempre consulte um profissional de saúde!**`,
  },
  {
    id: "tips",
    title: "Dicas para Começar",
    icon: Apple,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    content: `🎯 **Comece devagar** - Inicie com 14:10 ou 16:8

💧 **Hidrate-se** - A água é sua melhor amiga

😴 **Durma bem** - O sono conta como jejum!

🏃 **Exercícios leves** - Ok em jejum, pesados coma antes

📅 **Seja consistente** - Mantenha horários regulares

🍽️ **Não exagere** - Não compense comendo demais

📝 **Registre tudo** - Use o app para acompanhar!`,
  },
];

export default function FastingEducationModal({ open, onClose, onConfirm }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [agreedToRisks, setAgreedToRisks] = useState(false);

  const slide = EDUCATION_SLIDES[currentSlide];
  const isLastSlide = currentSlide === EDUCATION_SLIDES.length - 1;
  const isRisksSlide = slide.id === "risks";
  const SlideIcon = slide.icon;

  const handleNext = () => {
    if (isLastSlide) {
      onConfirm();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const canProceed = !isRisksSlide || agreedToRisks;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${slide.bgColor} flex items-center justify-center`}>
              <SlideIcon className={`w-6 h-6 ${slide.color}`} />
            </div>
            <DialogTitle className="text-white text-xl">{slide.title}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {EDUCATION_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSlide ? "bg-green-500 w-6" : "bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-4"
          >
            <div className="text-slate-300 whitespace-pre-line text-sm leading-relaxed">
              {slide.content.split('\n').map((line, idx) => {
                // Bold text
                let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
                return (
                  <p 
                    key={idx} 
                    className="mb-2"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                  />
                );
              })}
            </div>

            {/* Risk acknowledgment */}
            {isRisksSlide && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={agreedToRisks}
                    onCheckedChange={setAgreedToRisks}
                    className="mt-0.5 border-yellow-600 data-[state=checked]:bg-yellow-600"
                  />
                  <span className="text-yellow-300 text-sm">
                    Li e entendi os riscos. Confirmo que não tenho contraindicações e assumo a responsabilidade pelo meu jejum.
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="flex gap-2">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="bg-slate-800 border-slate-600 text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isLastSlide ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Entendi, Iniciar Jejum
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}