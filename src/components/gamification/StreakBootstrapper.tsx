// src/components/gamification/StreakBootstrapper.tsx

import { useEffect, useRef } from 'react';

import { onAuthStateChanged } from '../../services/auth';
import { checkAndUpdateStreak } from '../../services/streakService';
import { useStreakStore } from '../../store/useStreakStore';

export const StreakBootstrapper = () => {
  const lastCheckedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (!user) {
        lastCheckedUserIdRef.current = null;
        return;
      }

      if (lastCheckedUserIdRef.current === user.uid) {
        return;
      }

      lastCheckedUserIdRef.current = user.uid;

      try {
        const result = await checkAndUpdateStreak(user.uid);

        if (result.updatedToday && result.currentStreak > 1) {
          useStreakStore.getState().showStreakCelebration({
            currentStreak: result.currentStreak,
            bestStreak: result.bestStreak,
            isNewRecord: result.isNewRecord,
            awardedSevenDayXP: result.awardedSevenDayXP,
          });
        }
      } catch (error) {
        console.warn('Streak check failed:', error);
      }
    });

    return unsubscribe;
  }, []);

  return null;
};