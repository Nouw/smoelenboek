import {createEntityAdapter, createSlice, EntityState, PayloadAction} from "@reduxjs/toolkit";
import {Committee, UserCommitteeSeason} from "smoelenboek-types";
import {RootState} from "../store";
import {GetCommitteeResponse, Member} from "../../api/endpoints/committees";

export const committeesAdapter = createEntityAdapter<Committee>({
  selectId: (committee) => committee.id,
})

export interface CommitteesState {
  committees: EntityState<Committee>;
  committeeInfo?: GetCommitteeResponse;
}

const initialState: CommitteesState = {
  committees: committeesAdapter.getInitialState(),
  committeeInfo: undefined,
}

const committeesSlice = createSlice({
  name: "committees",
  initialState,
  reducers: {
    addCommittees(state, action: PayloadAction<Committee[]>) {
      committeesAdapter.addMany(state.committees, action.payload);
    },
    removeCommittee(state, action: PayloadAction<number>) {
      committeesAdapter.removeOne(state.committees, action.payload);
    },
    updateCommittees(state, action: PayloadAction<Committee[]>) {
      committeesAdapter.upsertMany(state.committees, action.payload);
    },
    setCommittee(state, action: PayloadAction<GetCommitteeResponse>) {
      state.committeeInfo = action.payload;
    },
    addMemberToCommittee(state, action: PayloadAction<UserCommitteeSeason>) {
      if (state.committeeInfo === undefined) {
        return;
      }

      state.committeeInfo.members = [...state.committeeInfo.members, action.payload as unknown as Member];
    },
    removeMemberFromCommittee(state, action: PayloadAction<number>) {
      if (state.committeeInfo === undefined) {
        return;
      }

      state.committeeInfo.members = state.committeeInfo.members.filter((_a, index) => index !== action.payload);
    },
    updateMember(state, action: PayloadAction<{ key: number, data: UserCommitteeSeason}>) {
      if (state.committeeInfo === undefined) {
        return;
      }

      state.committeeInfo.members[action.payload.key].function = action.payload.data.function;
    }
  }
});

export const committeesSelector = committeesAdapter.getSelectors<RootState>(state => state.committees.committees);

export const {
  addCommittees,
  removeCommittee,
  updateCommittees,
  setCommittee,
  addMemberToCommittee,
  removeMemberFromCommittee,
  updateMember
} = committeesSlice.actions;

export default committeesSlice.reducer;
