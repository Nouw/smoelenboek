import "./App.css";
import { Provider } from 'react-redux'
import { store } from './store/store'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { getTheme } from './utilities/theme'
import { ThemeProvider } from '@emotion/react'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import { Loading } from './components/loading'
import { SnackbarProvider } from "./providers/snackbar/snackbar.provider";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider/LocalizationProvider";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { nl } from 'date-fns/locale/nl';

function App() {
  const theme = getTheme();
  const persistor = persistStore(store);

  console.log(`Running Smoelenboek with version ${import.meta.env.VITE_REACT_APP_VERSION}`)

  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={nl}>
            <DndProvider backend={HTML5Backend}>
              <SnackbarProvider>
                <RouterProvider router={router} />
              </SnackbarProvider>
            </DndProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>

  )
}

export default App
