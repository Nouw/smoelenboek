import {createEntityAdapter, createSlice, EntityState, PayloadAction} from "@reduxjs/toolkit";
import {User} from "smoelenboek-types";
import {RootState} from "../store";


export const membersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
});

export interface MembersState {
  members: EntityState<User>;
}

const initialState: MembersState = {
  members: membersAdapter.getInitialState(),
}

const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    addMembers(state, action: PayloadAction<User[]>) {
      membersAdapter.addMany(state.members, action.payload);
    },
    removeMember(state, action: PayloadAction<number>) {
      membersAdapter.removeOne(state.members, action.payload);
    },
    updateMembers(state, action: PayloadAction<User[]>) {
      membersAdapter.upsertMany(state.members, action.payload);
    }
  }
})

export const membersSelector = membersAdapter.getSelectors<RootState>(state => state.members.members);

export const { addMembers, removeMember, updateMembers } = membersSlice.actions;

export default membersSlice.reducer;
