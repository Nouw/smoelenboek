import {API, Response} from "../API";
import {Season} from "smoelenboek-types";

export type GetSeasonResponse = Season[];

interface PutSeasonRequest {
  id: number | string;
  startDate: string;
  endDate: string;
}

interface PostSeasonRequest {
  startDate: string;
  endDate: string;
}

export const SeasonApiSlice = API.enhanceEndpoints({ addTagTypes: ['Season']}).injectEndpoints({
  endpoints: builder => ({
    seasons: builder.mutation<Response<GetSeasonResponse>, null> ({
      query: () => ({
        url: 'season/list',
        method: 'GET'
      })
    }),
    remove: builder.mutation<Response<undefined>, number>({
      query: ( id) => ({
        url: `season/${id}`,
        method: 'DELETE'
      })
    }),
    update: builder.mutation<Response<Season>, PutSeasonRequest>({
      query: (data) => ({
        url: `season/${data.id}`,
        method: 'PUT',
        body: {
          startDate: data.startDate,
          endDate: data.endDate
        }
      })
    }),
    create: builder.mutation<Response<Season>, PostSeasonRequest>({
      query: (data) => ({
        url: 'season',
        method: 'POST',
        body: data,
      })
    })
  })
});

export const { useSeasonsMutation, useRemoveMutation, useUpdateMutation, useCreateMutation }  = SeasonApiSlice;
