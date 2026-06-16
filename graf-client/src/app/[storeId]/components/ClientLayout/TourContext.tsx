'use client';
import { createContext, useContext } from 'react';

interface TourContextValue {
  startTour: () => void;
}

export const TourContext = createContext<TourContextValue>({
  startTour: () => {},
});

export function useTour() {
  return useContext(TourContext);
}
