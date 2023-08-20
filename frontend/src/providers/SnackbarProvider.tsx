import { Alert, Snackbar } from '@mui/material';
import React from 'react';
import { SnackbarContext } from './SnackbarContext';

type SnackbarProviderProps = {
  children?: JSX.Element | JSX.Element[]
}

// eslint-disable-next-line react-refresh/only-export-components
export enum Severity {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
}


export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
    const [visible, setVisible] = React.useState<boolean>(false);
    const [message, setMessage] = React.useState<string>('');
    const [severity, setSeverity] = React.useState<Severity>(Severity.INFO);

    function openSnackbar(msg: string, type = Severity.INFO) {
      setVisible(true)
      setMessage(msg);
      setSeverity(type);
    }

    return <SnackbarContext.Provider value={{ visible, message, openSnackbar}}>
      {children}
      <Snackbar
          open={visible}
          onClose={() => setVisible(false)}
          autoHideDuration={5000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
        <Alert severity={severity} onClose={() => setVisible(false)}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
}



