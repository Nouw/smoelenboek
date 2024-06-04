import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Activity } from "smoelenboek-types";

export interface ActivityState {
  activitiesManaged: Activity[];
}

const initialState: ActivityState = {
  activitiesManaged: [],
}

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reduces: {
    setActivitiesManaged(state, action: PayloadAction<Activity[]>) {
      state.activitiesManaged = action.payload; 
    }
  }
});

export const {
  setActivitiesManaged
} = activitySlice.actions;

export default activitySlice.reducer;
