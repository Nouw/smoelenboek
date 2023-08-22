import { API, Response } from "../API";
import {ProtototoMatch, ProtototoPredictions, ProtototoSeason} from "smoelenboek-types";

interface PostProtototoSeason {
  startDate: Date;
  endDate: Date;
  tikkie?: string;
}

interface PutProtototoSeason extends PostProtototoSeason {
  id: number;
}

interface GetProtototoMatch {
  match: ProtototoMatch;
  prediction: ProtototoPredictions;
}

interface PutProtototoMatch {
  id: number;
  playDate: Date;
  homeTeam: string;
  awayTeam: string;
  gender: "male" | "female";
  seasonId: number;
}

export interface PostProtototoMatch extends Partial<ProtototoMatch> {
  seasonId: number;
}

interface PostProtototoBet {
  id: number;
  setOne: boolean;
  setTwo: boolean;
  setThree: boolean;
  setFour?: boolean;
  setFive?: boolean;
}

export const protototoApiSlice = API.enhanceEndpoints({ addTagTypes: ['Protototo']}).injectEndpoints({
  endpoints: builder => ({
    protototoSeasons: builder.mutation<Response<ProtototoSeason[]>, null>({
      query: () => ({
        url: 'protototo/seasons',
        method: 'GET',
      }),
    }),
    removeProtototoSeason: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `protototo/season/${id}`,
        method: 'DELETE'
      })
    }),
    addProtototoSeason: builder.mutation<Response<ProtototoSeason>,PostProtototoSeason>({
      query: (data) => ({
        url: `protototo/season`,
        method: 'POST',
        body: {
          start: data.startDate,
          end: data.endDate,
          tikkie: data.tikkie,
        }
      })
    }),
    updateProtototoSeason: builder.mutation<Response<ProtototoSeason>,PutProtototoSeason>({
      query: (data) => ({
        url: `protototo/season/${data.id}`,
        method: 'PUT',
        body: {
          start: data.startDate,
          end: data.endDate,
          tikkie: data.tikkie,
        }
      })
    }),
    protototoMatches: builder.query<Response<GetProtototoMatch[]>, number | void>({
      query: (id) => ({
        url: `protototo/matches?seasonId=${id}`,
        method: 'GET'
      })
    }),
    protototoRemoveMatch: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `protototo/match/${id}`,
        method: 'DELETE'
      })
    }),
    protototoMatch: builder.mutation<Response<ProtototoMatch>, number>({
      query: (id) => ({
        url: `protototo/match/${id}`,
        method: 'GET'
      })
    }),
    postProtototoMatch: builder.mutation<Response<void>, PostProtototoMatch>({
      query: (body) => ({
        url: `protototo/match`,
        method: 'POST',
        body,
      })
    }),
    updateProtototoMatch: builder.mutation<Response<ProtototoMatch>, PutProtototoMatch>({
      query: (data) => ({
        url: `protototo/match/${data.id}`,
        method: 'PUT',
        body: {
          playDate: data.playDate,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          gender: data.gender,
          seasonId: data.seasonId,
        }
      })
    }),
    postProtototoBet: builder.mutation<Response<null>, PostProtototoBet>({
      query: (data) => ({
        url: `protototo/bet?id=${data.id}`,
        method: 'POST',
        body: {
          setOne: data.setOne,
          setTwo: data.setTwo,
          setThree: data.setThree,
          setFour: data.setFour,
          setFive: data.setFive,
        }
      })
    })
  })
})

export const {
  useProtototoSeasonsMutation,
  useRemoveProtototoSeasonMutation,
  useAddProtototoSeasonMutation,
  useUpdateProtototoSeasonMutation,
  useProtototoMatchesQuery,
  useLazyProtototoMatchesQuery,
  usePostProtototoMatchMutation,
  useProtototoRemoveMatchMutation,
  useProtototoMatchMutation,
  useUpdateProtototoMatchMutation,
  usePostProtototoBetMutation,
} = protototoApiSlice;
