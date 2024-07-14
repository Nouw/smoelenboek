import { CreateSeasonDto, Season, UpdateSeasonDto } from "backend";
import { API } from "../API";

export const seasonsApiSlice = API.enhanceEndpoints({ addTagTypes: ["Seasons"] }).injectEndpoints({
  endpoints: builder => ({
    getSeasons: builder.query<Season[], void>({
      query: () => ({
        url: "season",
        method: "GET",
      })
    }),
    deleteSeason: builder.mutation<void, number>({
      query: (id) => ({
        url: `season/${id}`,
        method: "DELETE",
      })
    }),
    getOverlap: builder.query<Season[], { date: string, id?: number }>({
      query: ({ date, id }) => ({
        url: `season/overlap/${date}${id ? `?id=${id}` : ''}`,
        method: "GET"
      })
    }),
    updateSeason: builder.mutation<Season, UpdateSeasonDto & { id: number }>({
      query: (body) => ({
        url: `season/${body.id}`,
        method: "PATCH",
        body,
      })
    }),
    getSeason: builder.query<Season, number>({
      query: (id) => ({
        url: `season/${id}`,
        method: "GET",
      })
    }),
    createSeason: builder.mutation<Season, CreateSeasonDto>({
      query: (body) => ({
        url: 'season',
        method: 'POST',
        body,
      })
    }) 
  })
});

export const {
  useDeleteSeasonMutation,
  useUpdateSeasonMutation,
  useCreateSeasonMutation,
} = seasonsApiSlice;
