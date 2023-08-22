import React from 'react';
import { Severity } from './SnackbarProvider';

interface SnackbarContextType {
  visible: boolean;
  message: string;
  openSnackbar: (msg: string, type?: Severity) => void;
}

export const SnackbarContext = React.createContext<SnackbarContextType>({} as SnackbarContextType);
