import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallPrompt({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader className="relative pb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">
                    Instalar IA Coach Fitness
                  </CardTitle>
                  <p className="text-slate-400 text-sm mt-1">
                    Acesse mais rápido e offline
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
                  <p className="text-blue-400 text-sm font-medium mb-3">
                    📱 Como adicionar à tela inicial:
                  </p>
                  <ol className="space-y-3 text-slate-300 text-sm">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                        1
                      </div>
                      <div>
                        Toque no botão <Share className="w-4 h-4 inline mx-1 text-blue-400" /> 
                        <span className="font-semibold">"Compartilhar"</span> (Safari) ou no menu do navegador
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                        2
                      </div>
                      <div>
                        Procure e toque em <Plus className="w-4 h-4 inline mx-1 text-blue-400" /> 
                        <span className="font-semibold">"Adicionar à Tela de Início"</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                        3
                      </div>
                      <div>
                        Confirme tocando em <span className="font-semibold">"Adicionar"</span>
                      </div>
                    </li>
                  </ol>
                </div>
                
                <div className="text-center">
                  <p className="text-slate-400 text-xs mb-3">
                    Após instalado, você terá acesso rápido ao app direto da tela inicial! 🚀
                  </p>
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white w-full"
                  >
                    Entendi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}