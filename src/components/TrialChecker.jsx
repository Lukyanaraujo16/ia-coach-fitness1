import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function TrialChecker({ user, onTrialExpired }) {
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!user || user.subscription_status !== 'trial') return;
      
      const trialEndDate = new Date(user.premium_trial_end_date);
      const now = new Date();
      
      // Verificar se o trial expirou
      if (now > trialEndDate) {
        // Trial expirou - downgrade para free
        try {
          await base44.auth.updateMe({
            subscription_status: 'free'
          });
          
          if (onTrialExpired) {
            onTrialExpired();
          }
        } catch (error) {
          console.error('Erro ao atualizar status do trial:', error);
        }
      }
    };

    checkTrialStatus();
    
    // Verificar a cada hora
    const interval = setInterval(checkTrialStatus, 1000 * 60 * 60);
    
    return () => clearInterval(interval);
  }, [user, onTrialExpired]);

  return null;
}