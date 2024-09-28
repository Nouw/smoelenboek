import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authSlice from "./slices/auth.slice";
import { API } from "../api/API";

const reducers = combineReducers({
  [API.reducerPath]: API.reducer,
  auth: persistReducer({ key: "auth", storage }, authSlice)
});

export const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware({
      serializableCheck: false,
    }),
    API.middleware,
  ]
})

let rehydrationResolve: () => void;

export const rehydrationPromise = new Promise<void>((resolve) => {
  rehydrationResolve = resolve;
});

export const persistor = persistStore(store, null, () => rehydrationResolve());

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
