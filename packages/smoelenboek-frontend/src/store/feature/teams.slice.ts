import {createEntityAdapter, createSlice, EntityState, PayloadAction} from "@reduxjs/toolkit";
import {Team, UserTeamSeason} from "smoelenboek-types";
import {RootState} from "../store";
import {GetTeamInfoResponse, Player} from "../../api/endpoints/team";

export const teamsAdapter = createEntityAdapter<Team>({
  selectId: (team) => team.id,
});

export interface TeamsState {
  teams: EntityState<Team>;
  teamInfo?: GetTeamInfoResponse
}

const initialState: TeamsState = {
  teams: teamsAdapter.getInitialState(),
  teamInfo: undefined,
}

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    addTeams(state, action: PayloadAction<Team[]>) {
      teamsAdapter.addMany(state.teams, action.payload);
    },
    removeTeam(state, action: PayloadAction<number>) {
      teamsAdapter.removeOne(state.teams, action.payload);
    },
    updateTeams(state, action: PayloadAction<Team[]>) {
      teamsAdapter.upsertMany(state.teams, action.payload);
    },
    setTeamInfo(state, action: PayloadAction<GetTeamInfoResponse>) {
      state.teamInfo = action.payload;
    },
    addPlayerToTeam(state, action: PayloadAction<UserTeamSeason>) {
      if (state.teamInfo === undefined) {
        return;
      }

      state.teamInfo.players = [...state.teamInfo.players, action.payload as unknown as Player];
    },
    removePlayerFromTeam(state, action: PayloadAction<number>) {
      if (state.teamInfo === undefined) {
        return;
      }

      state.teamInfo.players = state.teamInfo.players.filter((_a,index) => index !== action.payload);

      return;
    },
    updatePlayer(state, action: PayloadAction<{ key: number, data: UserTeamSeason}>) {
      if (state.teamInfo === undefined) {
        return;
      }

      state.teamInfo.players[action.payload.key].function = action.payload.data.function;
    }
  }
});

export const teamsSelector = teamsAdapter.getSelectors<RootState>(state => state.teams.teams);

export const {
  addTeams,
  removeTeam,
  updateTeams,
  setTeamInfo,
  addPlayerToTeam,
  removePlayerFromTeam,
  updatePlayer,
} = teamsSlice.actions;

export default teamsSlice.reducer;
