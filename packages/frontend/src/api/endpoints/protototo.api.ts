import { API } from "../API.ts";
import {
    CreateProtototoMatchDto,
  CreateProtototoSeasonDto,
  ProtototoMatch,
  ProtototoMatchResult,
  ProtototoSeason,
  UpdateProtototoDto,
} from "backend";

export const protototoApiSlice = API.enhanceEndpoints({
  addTagTypes: ["Protototo", "ProtototoMatch"],
}).injectEndpoints({
  endpoints: (builder) => ({
    createProtototoSeason: builder.mutation<
      ProtototoSeason,
      CreateProtototoSeasonDto
    >({
      query: (body) => ({
        url: `protototo/season/`,
        method: "POST",
        body,
      }),
    }),
    getOverlap: builder.query<ProtototoSeason[], { date: string; id?: number }>(
      {
        query: ({ date, id }) => ({
          url: `protototo/season/overlap/${date}${id ? `?id=${id}` : ""}`,
          method: "GET",
        }),
      },
    ),
    getProtototoSeasons: builder.query<ProtototoSeason[], void>({
      query: () => ({
        url: "protototo/season/",
        method: "GET",
      }),
    }),
    deletePrototoSeason: builder.mutation<void, number>({
      query: (id) => ({
        url: `protototo/season/${id}`,
        method: "DELETE",
      }),
    }),
    getMatches: builder.query<ProtototoMatch[], number>({
      query: (id) => ({
        url: `protototo/season/${id}/matches`,
        method: "GET",
      }),
      providesTags: (_, _e, seasonId) => [{ type: "ProtototoMatch", id: seasonId }],
    }),
    addMatch: builder.mutation<void, CreateProtototoMatchDto>({
      query: (body) => ({
        url: "protototo/season/match",
        method: "POST",
        body,
      })
    }),
    deleteProtototoMatch: builder.mutation<void, { matchId: number, seasonId: number }>({
      query: ({ matchId }) => ({
        url: `protototo/season/match/${matchId}`,
        method: "DELETE"
      }),
      invalidatesTags: (_r, _e, { seasonId }) => [{ type: "ProtototoMatch", id: seasonId }]
    }),
    fetchProtototoMatchResult: builder.mutation<ProtototoMatchResult, number>({
      query: (id) => ({
        url: `protototo/match/${id}/result`,
        method: "POST",
      })
    }),
    getProtototoParticipants: builder.mutation<unknown, number>({
      query: (id) => ({
        url: `protototo/season/${id}/participants`,
        method: "GET",
        responseHandler: async (response) => window.location.assign(window.URL.createObjectURL(await response.blob())),
        cache: "no-cache",
      })
    }),
    updateProtototoSeason: builder.mutation<ProtototoSeason, { id: number, body: UpdateProtototoDto}>({
      query: ({ id, body }) => ({
        url: `protototo/${id}`,
        method: "PATCH",
        body,
      })
    }),
    getProtototoSeason: builder.query<ProtototoSeason, number>({
      query: (id) => ({
        url: `protototo/${id}`,
        method: "GET",
      })
    })
  }),
});

export const {
  useCreateProtototoSeasonMutation,
  useDeletePrototoSeasonMutation,
  useGetProtototoSeasonsQuery,
  useAddMatchMutation,
  useGetMatchesQuery,
  useDeleteProtototoMatchMutation,
  useFetchProtototoMatchResultMutation,
  useGetProtototoParticipantsMutation,
  useUpdateProtototoSeasonMutation,
} = protototoApiSlice;
