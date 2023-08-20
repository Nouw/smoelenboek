import {Season} from "smoelenboek-types";
import {createEntityAdapter, createSlice, EntityState, PayloadAction} from "@reduxjs/toolkit";
import {RootState} from "../store";

export const seasonAdapter = createEntityAdapter<Season>({
  selectId: (season) => season.id
})

export interface SeasonState {
  seasons: EntityState<Season>;
}

const initialState: SeasonState = {
  seasons: seasonAdapter.getInitialState(),
}


const seasonSlice = createSlice({
  name: "season",
  initialState,
  reducers: {
    addSeasons(state, action: PayloadAction<Season[]>) {
      seasonAdapter.addMany(state.seasons, action.payload);
    },
    removeSeason(state, action: PayloadAction<number>) {
      seasonAdapter.removeOne(state.seasons, action.payload)
    },
    updateSeasons(state, action: PayloadAction<Season[]>) {
      seasonAdapter.upsertMany(state.seasons, action.payload);
    }
  }
})

export const seasonsSelector = seasonAdapter.getSelectors<RootState>(state => state.season.seasons);

export const { addSeasons, removeSeason, updateSeasons } = seasonSlice.actions;

export default seasonSlice.reducer;
