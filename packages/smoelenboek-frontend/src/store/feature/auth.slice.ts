import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Roles} from 'smoelenboek-types';
import i18n from "../../utilities/i18n/i18n.ts";

export interface AuthState {
  language: string,
  id?: number,
  accessToken?: string,
  refreshToken?: string,
  roles: Array<Roles>,
}

const initialState: AuthState = {
  language: 'nl',
  accessToken: undefined,
  refreshToken: undefined,
  roles: [],
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ id: number, accessToken: string, refreshToken: string }>) {
      state.id = action.payload.id;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setAccessToken(state, action: PayloadAction<string | undefined>) {
      state.accessToken = action.payload;
    },
    setRefreshToken(state, action: PayloadAction<string | undefined>) {
      state.refreshToken = action.payload;
    },
    logout(state) {
      state.accessToken = undefined;
      state.refreshToken = undefined;
      state.roles = [Roles.ANONYMOUS];
    },
    setRoles(state, action: PayloadAction<Roles[]>) {
      state.roles = action.payload;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
      i18n.changeLanguage(action.payload);
    },
    setId(state, action: PayloadAction<number>) {
      state.id = action.payload;
    }
  },
})

export const {
  logout,
  setAccessToken,
  setCredentials ,
  setRoles,
  setLanguage,
  setId
} = authSlice.actions;

export default authSlice.reducer;
