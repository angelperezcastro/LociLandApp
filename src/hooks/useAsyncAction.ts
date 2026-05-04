// src/hooks/useAsyncAction.ts

import { useCallback, useRef, useState } from 'react';

type AsyncAction<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

type UseAsyncActionResult<TArgs extends unknown[], TResult> = {
  isRunning: boolean;
  run: (...args: TArgs) => Promise<TResult | undefined>;
};

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: AsyncAction<TArgs, TResult>,
): UseAsyncActionResult<TArgs, TResult> {
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      if (isRunningRef.current) {
        return undefined;
      }

      isRunningRef.current = true;
      setIsRunning(true);

      try {
        return await action(...args);
      } finally {
        isRunningRef.current = false;
        setIsRunning(false);
      }
    },
    [action],
  );

  return {
    isRunning,
    run,
  };
}
