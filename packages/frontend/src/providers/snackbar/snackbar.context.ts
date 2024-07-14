import React from "react";

interface SnackbarContext {
  info: (msg: string) => void;
  error: (msg: string) => void;
  warn: (msg: string) => void;
  success: (msg: string) => void;
}

export const SnackbarContext = React.createContext<SnackbarContext>({} as SnackbarContext);
