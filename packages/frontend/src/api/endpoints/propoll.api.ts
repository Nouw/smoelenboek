import { CreatePropollDto } from "backend";
import { API } from "../API";

export interface PropollOptionResponse {
  id: number;
  text: string;
  votes: number;
}

export interface PropollResponse {
  id: number;
  question: string;
  allowMultiple: boolean;
  voteStartAt: string | null;
  voteEndAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalVotes: number;
  selectedOptionIds: number[];
  options: PropollOptionResponse[];
}

export interface UpdatePropollDto {
  question: string;
  allowMultiple: boolean;
  voteStartAt: Date;
  voteEndAt: Date;
  options: Array<{ id?: number; text: string }>;
}

export interface VotePropollDto {
  optionIds: number[];
}

export const propollApiSlice = API.enhanceEndpoints({
  addTagTypes: ["Propolls"],
}).injectEndpoints({
  endpoints: (builder) => ({
    getPolls: builder.query<PropollResponse[], void>({
      query: () => ({
        url: "propoll",
        method: "GET",
      }),
      providesTags: ["Propolls"],
    }),
    getPoll: builder.query<PropollResponse, number>({
      query: (id) => ({
        url: `propoll/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Propolls", id }],
    }),
    getActivePolls: builder.query<PropollResponse[], void>({
      query: () => ({
        url: "propoll/active",
        method: "GET",
      }),
      providesTags: ["Propolls"],
    }),
    createPoll: builder.mutation<PropollResponse, CreatePropollDto>({
      query: (body) => ({
        url: "propoll",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Propolls"],
    }),
    updatePoll: builder.mutation<
      PropollResponse,
      {
        id: number;
        body: UpdatePropollDto;
      }
    >({
      query: ({ id, body }) => ({
        url: `propoll/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Propolls",
        { type: "Propolls", id },
      ],
    }),
    deletePoll: builder.mutation<void, number>({
      query: (id) => ({
        url: `propoll/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Propolls"],
    }),
    votePoll: builder.mutation<
      PropollResponse,
      {
        id: number;
        body: VotePropollDto;
      }
    >({
      query: ({ id, body }) => ({
        url: `propoll/${id}/vote`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Propolls",
        { type: "Propolls", id },
      ],
    }),
  }),
});

export const {
  useCreatePollMutation,
  useDeletePollMutation,
  useUpdatePollMutation,
  useVotePollMutation,
} = propollApiSlice;
