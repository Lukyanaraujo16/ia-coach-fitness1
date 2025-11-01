import { useEffect, useState } from "react";
import { 
  initOneSignal, 
  requestOneSignalPermission, 
  isOneSignalSubscribed,
  setOneSignalTags,
  setOneSignalExternalUserId 
} from "@/utils/onesignal";
import { toast } from "sonner";

export function useOneSignalNotifications(user) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initOneSignal();

    const checkSubscription = async () => {
      const subscribed = await isOneSignalSubscribed();
      setIsSubscribed(subscribed);
      setIsLoading(false);
    };

    setTimeout(checkSubscription, 1000);
  }, []);

  useEffect(() => {
    if (user?.id) {
      setOneSignalExternalUserId(user.id);
      
      setOneSignalTags({
        user_id: user.id,
        email: user.email,
        fitness_level: user.fitness_level || 'beginner',
        fitness_goal: user.fitness_goal || 'maintain',
        subscription: user.subscription_status || 'free',
        active: user.is_active !== false,
      });
    }
  }, [user]);

  const requestPermission = async () => {
    const result = await requestOneSignalPermission();
    
    if (result.success) {
      setIsSubscribed(true);
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
    
    return result;
  };

  return {
    isSubscribed,
    isLoading,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  };
}

export default useOneSignalNotifications;