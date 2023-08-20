import {createEntityAdapter, createSlice, EntityState, PayloadAction} from "@reduxjs/toolkit";
import {ProtototoMatch, ProtototoSeason} from "smoelenboek-types";
import {RootState} from "../store";


export const protototoSeasonAdapter = createEntityAdapter<ProtototoSeason>({
  selectId: (season) => season.id,
});

export const protototoMatchAdapter = createEntityAdapter<ProtototoMatch>({
  selectId: (match) => match.id,
})

export interface ProtototoState {
  seasons: EntityState<ProtototoSeason>;
  matches: EntityState<ProtototoMatch>;
}

const initialState: ProtototoState = {
  seasons: protototoSeasonAdapter.getInitialState(),
  matches: protototoMatchAdapter.getInitialState(),
}

const protototoSlice = createSlice({
  name: 'protototo',
  initialState,
  reducers: {
    addSeasons(state, action: PayloadAction<ProtototoSeason[]>) {
      protototoSeasonAdapter.addMany(state.seasons, action.payload);
    },
    removeSeason(state, action: PayloadAction<number>) {
      protototoSeasonAdapter.removeOne(state.seasons, action.payload);
    },
    updateSeasons(state, action: PayloadAction<ProtototoSeason[]>) {
      protototoSeasonAdapter.upsertMany(state.seasons, action.payload);
    },
    addMatches(state, action: PayloadAction<ProtototoMatch[]>) {
      protototoMatchAdapter.addMany(state.matches, action.payload);
    },
    removeMatch(state, action: PayloadAction<number>) {
      protototoMatchAdapter.removeOne(state.matches, action.payload);
    },
    updateMatches(state, action: PayloadAction<ProtototoMatch[]>) {
      protototoMatchAdapter.upsertMany(state.matches, action.payload);
    }
  }
});

export const protototoSeasonSelector = protototoSeasonAdapter.getSelectors<RootState>(state => state.protototo.seasons);
export const protototoMatchSelector = protototoMatchAdapter.getSelectors<RootState>(state => state.protototo.matches);

export const {
  addSeasons,
  removeSeason,
  updateSeasons,
  addMatches,
  removeMatch,
  updateMatches,
} = protototoSlice.actions;

export default protototoSlice.reducer;
