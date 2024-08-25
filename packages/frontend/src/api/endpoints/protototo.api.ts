import { API } from "../API.ts";
import {
  CreateProtototoSeasonDto,
  ProtototoMatch,
  ProtototoSeason,
} from "backend";

export const protototoApiSlice = API.enhanceEndpoints({
  addTagTypes: ["Protototo"],
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
    }),
  }),
});

export const {
  useCreateProtototoSeasonMutation,
  useDeletePrototoSeasonMutation,
} = protototoApiSlice;
