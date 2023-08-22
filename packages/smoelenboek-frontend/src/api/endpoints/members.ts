import {API, Response} from "../API";
import {User} from "smoelenboek-types";

export interface PutUserRequest {
  admin: boolean,
  user: User,
}

export const MembersApiSlice = API.enhanceEndpoints({ addTagTypes: ['Members'] }).injectEndpoints({
  endpoints: builder => ({
    members: builder.mutation<Response<User[]>, null>({
      query: () => ({
        url: 'user/list',
        method: 'GET'
      })
    }),
    remove: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `user/${id}`,
        method: 'DELETE'
      })
    }),
    updateMember: builder.mutation<Response<User>, PutUserRequest>({
      query: (data) => ({
        url: `user/${data.user.id}?admin=${data.admin}`,
        method: 'PUT',
        body: { ...data.user }
      })
    }),
    createMember: builder.mutation<Response<User>, User>({
      query: (data) => ({
        url: `user/`,
        method: 'POST',
        body: data,
      })
    })
  })
});

export const { useMembersMutation, useRemoveMutation, useUpdateMemberMutation, useCreateMemberMutation } = MembersApiSlice;
