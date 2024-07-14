import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
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

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
