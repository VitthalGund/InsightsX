"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AnalystModeContextType {
  analystMode: boolean;
  setAnalystMode: (v: boolean) => void;
}

const AnalystModeContext = createContext<AnalystModeContextType>({
  analystMode: false,
  setAnalystMode: () => {},
});

export function AnalystModeProvider({ children }: { children: ReactNode }) {
  const [analystMode, setAnalystMode] = useState(false);
  return (
    <AnalystModeContext.Provider value={{ analystMode, setAnalystMode }}>
      {children}
    </AnalystModeContext.Provider>
  );
}

export function useAnalystMode() {
  return useContext(AnalystModeContext);
}
