import { API, Response } from "../API";
import {Team, TeamFunction, UserTeamSeason} from "smoelenboek-types";

export interface GetTeamRequest {
  type: "male" | "female" | ""
}

type GetTeamResponse = Team[];

export interface GetTeamInfoResponse {
  players: Player[];
  teamInfo: Team;
}

export interface Player {
  id: number;
  function: TeamFunction,
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture: string;
  }
}

interface PostPlayerRequest {
  userId: number;
  id: number;
}

interface PutPlayerRequest {
  id: number;
  role: TeamFunction;
}

interface TeamRequest {
  id: number;
  rank: string;
  name: string;
  gender: string;
}

export const teamApiSlice = API.enhanceEndpoints({ addTagTypes: ['Team']}).injectEndpoints({
  endpoints: builder => ({
    teams: builder.mutation<Response<GetTeamResponse>, GetTeamRequest>({
      query: (data) => ({
        url: `team/?type=${data.type}`,
        method: 'GET'
      })
    }),
    removeTeam: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `team/${id}`,
        method: 'DELETE',
      })
    }),
    teamInfo: builder.mutation<Response<GetTeamInfoResponse>, number>({
      query: (id) => ({
        url: `team/info/${id}`,
        method: 'GET'
      })
    }),
    addPlayerToTeam: builder.mutation<Response<UserTeamSeason>, PostPlayerRequest>({
      query: (data) => ({
        url: `team/player/${data.id}`,
        method: 'POST',
        body: {
          userId: data.userId,
        }
      })
    }),
    removePlayerFromTeam: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `team/player/${id}`,
        method: 'DELETE'
      })
    }),
    updatePlayer: builder.mutation<Response<UserTeamSeason>, PutPlayerRequest>({
      query: (data) => ({
        url: `team/player/${data.id}`,
        method: 'PUT',
        body: {
          role: data.role
        }
      })
    }),
    updateTeam: builder.mutation<Response<Team>, TeamRequest>({
      query: (data) => ({
        url: `team/${data.id}`,
        method: 'PUT',
        body: {
          rank: data.rank,
          name: data.name,
          gender: data.gender,
        }
      })
    }),
    createTeam: builder.mutation<Response<Team>, TeamRequest>({
      query: (data) => ({
        url: `team/`,
        method: 'POST',
        body: {
          rank: data.rank,
          name: data.name,
          gender: data.gender,
        }
      })
    })
  })
})

export const {
  useTeamsMutation,
  useRemoveTeamMutation,
  useTeamInfoMutation,
  useAddPlayerToTeamMutation,
  useRemovePlayerFromTeamMutation,
  useUpdatePlayerMutation,
  useUpdateTeamMutation,
  useCreateTeamMutation
} = teamApiSlice;
