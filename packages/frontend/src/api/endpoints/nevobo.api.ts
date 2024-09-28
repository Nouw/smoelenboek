import { API } from "../API.ts";

interface getTeamsResponse {
  "hydra:member": TeamsMember[];
}

export interface TeamsMember {
  "@id": string;
  naam: string;
  vereniging: string;
}

const nevoboApiSlice = API.enhanceEndpoints({
  addTagTypes: ["Nevobo"],
}).injectEndpoints({
  endpoints: (builder) => ({
    getNevoboTeams: builder.query<getTeamsResponse, undefined>({
      query: () => ({
        url: `nevobo/teams`,
        method: "GET",
      }),
    }),
    getNevoboMatches: builder.query<any, string>({
      query: (team) => ({
        url: `nevobo/matches/${team}`,
        method: "GET",
      }),
    }),
    getNevoboTeam: builder.query<any, string>({
      query: (id) => ({
        url: `nevobo/team/${id}`,
        method: "GET",
      }),
    }),
    getNevoboMatch: builder.query<any, string>({
      query: (id) => ({
        url: `nevobo/match/result/${id}`,
        method: "GET",
      })
    })
  }),
});

export const {
  useGetNevoboTeamsQuery,
  useLazyGetNevoboMatchesQuery,
  useGetNevoboTeamQuery,
  useLazyGetNevoboMatchQuery,
} = nevoboApiSlice;
