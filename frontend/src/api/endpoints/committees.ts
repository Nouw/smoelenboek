import {API, Response} from "../API";
import {Committee, UserCommitteeSeason} from "smoelenboek-types";

export interface GetCommitteeResponse {
  committee: Committee;
  members: Member[];
}

export interface Member {
  id: number;
  function: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture: string;
  }
}

interface PostMemberRequest {
  userId: number;
  id: number;
}

interface PutMemberRequest {
  id: number;
  role: string;
}

interface PostCommitteeRequest {
  name: string;
  email?: string;
}

interface PutCommitteeRequest {
  id: number;
  name: string;
  email: string;
}

export const committeesApiSlice = API.enhanceEndpoints({ addTagTypes: ['Committees']}).injectEndpoints({
  endpoints: builder => ({
    committees: builder.mutation<Response<Committee[]>, null>({
      query: () => ({
        url: 'committee',
        method: 'GET'
      })
    }),
    removeCommittee: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `committee/${id}`,
        method: 'DELETE'
      })
    }),
    getCommittee: builder.mutation<Response<GetCommitteeResponse>, number>({
      query: (id) => ({
        url: `committee/${id}`,
        method: 'GET',
      })
    }),
    addMemberToCommittee: builder.mutation<Response<UserCommitteeSeason>, PostMemberRequest>({
      query: (data) => ({
        url: `committee/user/${data.id}`,
        method: 'POST',
        body: {
          userId: data.userId,
        }
      })
    }),
    removeMemberFromCommittee: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `committee/user/${id}`,
        method: 'DELETE'
      })
    }),
    updateMemberCommittee: builder.mutation<Response<UserCommitteeSeason>, PutMemberRequest>({
      query: (data) => ({
        url: `committee/user/${data.id}`,
        method: 'PUT',
        body: {
          role: data.role,
        }
      })
    }),
    createCommittee: builder.mutation<Response<Committee>,PostCommitteeRequest>({
      query: (data) => ({
        url: `committee/`,
        method: 'POST',
        body: {
          name: data.name,
          email: data.email,
        }
      })
    }),
    updateCommittee: builder.mutation<Response<Committee>, PutCommitteeRequest>({
      query: (data) => ({
        url: `committee/${data.id}`,
        method: 'PUT',
        body: {
          name: data.name,
          email: data.email,
        }
      })
    })
  })
});

export const {
  useCommitteesMutation,
  useRemoveCommitteeMutation,
  useGetCommitteeMutation,
  useAddMemberToCommitteeMutation,
  useRemoveMemberFromCommitteeMutation,
  useUpdateMemberCommitteeMutation,
  useCreateCommitteeMutation,
  useUpdateCommitteeMutation,
} = committeesApiSlice;
