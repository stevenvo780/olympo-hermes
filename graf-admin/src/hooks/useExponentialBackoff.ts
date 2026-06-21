import { useState, useEffect, useRef, useCallback } from 'react';

export function useExponentialBackoff(
  maxRetries = 3,
  initialDelayMs = 1000
) {
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<(() => void) | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setRetryCount(0);
    setCountdown(0);
    setIsRetrying(false);
  }, []);

  const scheduleRetry = useCallback((callback: () => void) => {
    if (retryCount >= maxRetries) {
      return;
    }
    if (isRetrying) {
      return; // Prevenir clicks múltiples mientras hay un reintento programado
    }

    setIsRetrying(true);
    callbackRef.current = callback;

    const delayMs = initialDelayMs * Math.pow(2, retryCount); // 1s, 2s, 4s...
    let secondsLeft = Math.ceil(delayMs / 1000);
    setCountdown(secondsLeft);

    // Increment retry count
    setRetryCount(prev => prev + 1);

    // Countdown interval
    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(0);
      } else {
        setCountdown(secondsLeft);
      }
    }, 1000);

    // Retry timeout
    timerRef.current = setTimeout(() => {
      setIsRetrying(false);
      if (callbackRef.current) {
        callbackRef.current();
      }
    }, delayMs);
  }, [retryCount, maxRetries, initialDelayMs, isRetrying]);

  return {
    retryCount,
    countdown,
    isRetrying,
    scheduleRetry,
    reset,
    setRetryCount
  };
}
