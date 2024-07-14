import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Role } from "backend";
import { LoginResponse } from "../../api/endpoints/auth.api";

export type AuthState = {
  id?: number;
  accessToken?: string;
  refreshToken?: string;
  role?: Role
}

const initialState: AuthState = {}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string | undefined>) {
      state.accessToken = action.payload;
    },
    setRefreshToken(state, action: PayloadAction<string | undefined>) {
      state.refreshToken = action.payload;
    },
    login(state, action: PayloadAction<LoginResponse>) {
      state.role = action.payload.role;
      state.id = action.payload.id;
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
    },
    logout(state) {
      state.refreshToken = undefined;
      state.id = undefined;
      state.accessToken = undefined;
      state.role = undefined;
    },
  }
})

export const { setAccessToken, setRefreshToken, login, logout } = authSlice.actions;

export default authSlice.reducer;
