import { Committee, CommitteeFunction, CreateCommitteeDto, UpdateCommitteeDto } from "backend";
import { API } from "../API";

export const committeesApiSlice = API.enhanceEndpoints({ addTagTypes: ["Commitees"] }).injectEndpoints({
  endpoints: builder => ({
    getCommittees: builder.query<Committee[], void>({
      query: () => ({
        url: "committees/",
        method: "GET",
      })
    }),
    getCommittee: builder.query<Committee, number>({
      query: (param) => ({
        url: `committees/${param}`,
        method: 'GET'
      })
    }),
    deleteCommitee: builder.mutation<void, number>({
      query: (id) => ({
        url: `committees/${id}`,
        method: 'DELETE',
      })
    }),
    addUserToCommittee: builder.mutation<Committee, { committeeId: number, userId: number }>({
      query: ({ committeeId, userId }) => ({
        url: `committees/user/${committeeId}/${userId}`,
        method: 'POST',
      })
    }),
    removeUserToCommittee: builder.mutation<Committee, { committeeId: number, userId: number }>({
      query: ({ committeeId, userId }) => ({
        url: `committees/user/${committeeId}/${userId}`,
        method: 'DELETE',
      })
    }),
    updateUserToCommittee: builder.mutation<Committee, { committeeId: number, userId: number, func: CommitteeFunction }>({
      query: ({ committeeId, userId, func }) => ({
        url: `committees/user/${committeeId}/${userId}`,
        method: "PATCH",
        body: {
          "function": func,
        }
      })
    }),
    createCommittee: builder.mutation<Committee, CreateCommitteeDto>({
      query: (body) => ({
        url: `committees/`,
        method: "POST",
        body,
      })
    }),
    updateCommittee: builder.mutation<Committee, { id: number, body: UpdateCommitteeDto }>({
      query: ({ id, body }) => ({
        url: `committees/${id}`,
        method: "PATCH",
        body,
      })
    })
  })
});

export const {
  useGetCommitteeQuery,
  useGetCommitteesQuery,
  useDeleteCommiteeMutation,
  useAddUserToCommitteeMutation,
  useRemoveUserToCommitteeMutation,
  useUpdateUserToCommitteeMutation,
  useUpdateCommitteeMutation,
  useCreateCommitteeMutation,
} = committeesApiSlice;
