import { Alert, Snackbar } from '@mui/material';
import React from 'react';
import { SnackbarContext } from './snackbar.context';

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

  function info(msg: string) {
    setVisible(true);
    setMessage(msg);
    setSeverity(Severity.INFO);
  }

  function error(msg: string) {
    setVisible(true);
    setMessage(msg);
    setSeverity(Severity.ERROR);
  }

  function warn(msg: string) {
    setVisible(true);
    setMessage(msg);
    setSeverity(Severity.WARNING);
  }

  function success(msg: string) {
    setVisible(true);
    setMessage(msg);
    setSeverity(Severity.SUCCESS);
  }


  return <SnackbarContext.Provider value={{ info, error, warn, success }}>
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
