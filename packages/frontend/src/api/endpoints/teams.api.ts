import { CreateTeamDto, Team, TeamFunction, UpdateTeamDto } from "backend";
import { API } from "../API";

export const teamsApiSlice = API.enhanceEndpoints({ addTagTypes: ["Teams"] }).injectEndpoints({
  endpoints: builder => ({
    getTeams: builder.query<Team[], void>({
      query: () => ({
        url: "teams",
        method: "GET",
      })
    }),
    getTeam: builder.query<Team, number>({
      query: (param) => ({
        url: `teams/${param}`,
        method: 'GET'
      })
    }),
    deleteTeam: builder.mutation<void, number>({
      query: (id) => ({
        url: `teams/${id}`,
        method: 'DELETE'
      })
    }),
    createTeam: builder.mutation<Team, CreateTeamDto>({
      query: (body) => ({
        url: 'teams',
        method: 'POST',
        body,
      })
    }),
    addUserToTeam: builder.mutation<Team, { teamId: number, userId: number }>({
      query: ({ teamId, userId }) => ({
        url: `teams/user/${teamId}/${userId}`,
        method: 'POST',
      })
    }),
    removeUserToTeam: builder.mutation<Team, { teamId: number, userId: number }>({
      query: ({ teamId, userId }) => ({
        url: `teams/user/${teamId}/${userId}`,
        method: 'DELETE',
      })
    }),
    updateUserToTeam: builder.mutation<Team, { teamId: number, userId: number, func: TeamFunction }>({
      query: ({ teamId, userId, func }) => ({
        url: `teams/user/${teamId}/${userId}`,
        method: "PATCH",
        body: {
          "function": func,
        }
      })
    }),
    updateTeam: builder.mutation<Team, { id: number, body: UpdateTeamDto }>({
      query: ({ id, body}) => ({
        url: `teams/${id}`,
        method: "PATCH",
        body,
      })
    })
  })
});

export const {
  useGetTeamsQuery,
  useGetTeamQuery,
  useDeleteTeamMutation,
  useCreateTeamMutation,
  useAddUserToTeamMutation,
  useRemoveUserToTeamMutation,
  useUpdateUserToTeamMutation,
  useUpdateTeamMutation,
} = teamsApiSlice;
