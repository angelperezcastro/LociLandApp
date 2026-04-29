// src/components/gamification/NotificationBootstrapper.tsx

import { useEffect, useRef } from 'react';

import { onAuthStateChanged } from '../../services/auth';
import { ensureDefaultDailyMemoryReminder } from '../../services/notificationService';

export const NotificationBootstrapper = () => {
  const hasTriedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (!user) {
        hasTriedForUserRef.current = null;
        return;
      }

      if (hasTriedForUserRef.current === user.uid) {
        return;
      }

      hasTriedForUserRef.current = user.uid;

      try {
        const result = await ensureDefaultDailyMemoryReminder();

        if (!result.scheduled && result.skippedReason) {
          console.info('Daily memory reminder skipped:', result.skippedReason);
        }
      } catch (error) {
        console.warn('Daily memory reminder setup failed:', error);
      }
    });

    return unsubscribe;
  }, []);

  return null;
};