"use client";

import { SessionProvider } from "next-auth/react";
import { AnalystModeProvider } from "@/context/AnalystModeContext";

type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  return <SessionProvider><AnalystModeProvider>{children}</AnalystModeProvider></SessionProvider>;
};
