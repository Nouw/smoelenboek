import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {User} from "smoelenboek-types";

export interface UserState {
  id?: number;
  profilePicture?: string;
  user?: User
}

const initialState: UserState = {
  id: undefined,
  profilePicture: undefined,
  user: undefined,
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setId(state, action: PayloadAction<number | undefined>) {
      state.id = action.payload;
    },
    setProfilePicture(state, action: PayloadAction<string | undefined>) {
      state.profilePicture = action.payload;
    }
  }
})

export const { setId, setProfilePicture } = userSlice.actions;
