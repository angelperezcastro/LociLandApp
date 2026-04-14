import { useCallback, useEffect, useState } from 'react';
import { getOnboardingSeen, setOnboardingSeen } from '../services/onboardingStorage';

type OnboardingStatus = {
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  markOnboardingSeen: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useOnboardingStatus(): OnboardingStatus {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const seen = await getOnboardingSeen();
      setHasSeenOnboarding(seen);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markOnboardingSeen = useCallback(async () => {
    await setOnboardingSeen();
    setHasSeenOnboarding(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    isLoading,
    hasSeenOnboarding,
    markOnboardingSeen,
    refresh,
  };
}