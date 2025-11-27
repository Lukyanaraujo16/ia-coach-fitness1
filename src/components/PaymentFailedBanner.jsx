import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PaymentFailedBanner({ user, onDismiss }) {
  if (!user?.payment_failed) return null;

  const failedDate = user.payment_failed_date 
    ? new Date(user.payment_failed_date).toLocaleDateString('pt-BR')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-600/50 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">
            Problema com seu pagamento
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            Não conseguimos processar sua última cobrança
            {failedDate && ` em ${failedDate}`}. 
            Atualize suas informações de pagamento para continuar com o Premium.
          </p>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Subscription")}>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Atualizar Pagamento
              </Button>
            </Link>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}