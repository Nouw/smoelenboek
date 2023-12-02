import {
  combineReducers,
  configureStore,
  getDefaultMiddleware,
} from "@reduxjs/toolkit";
import authSlice from "./feature/auth.slice";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { API } from "../api/API";
import SeasonSlice from "./feature/season.slice";
import MembersSlice from "./feature/members.slice";
import TeamsSlice from "./feature/teams.slice";
import CommitteesSlice from "./feature/committees.slice";
import ProtototoSlice from "./feature/protototo.slice";
import DocumentsSlice from "./feature/documents.slice";

const reducers = combineReducers({
  [API.reducerPath]: API.reducer,
  auth: persistReducer({
    key: "auth",
    storage,
  }, authSlice),
  season: SeasonSlice,
  members: MembersSlice,
  teams: TeamsSlice,
  committees: CommitteesSlice,
  protototo: ProtototoSlice,
  documents: DocumentsSlice,
});

export const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware({
      serializableCheck: false, 
    }),	
		API.middleware,	
  ], 
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
