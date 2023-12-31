import {API, Response} from "../API";
import {User} from "smoelenboek-types";

interface GetProfileResponse extends User {
  // eslint-disable-next-line
  seasons: any // TODO: Add type for this
}

export const userApiSlice = API.enhanceEndpoints({ addTagTypes: ['User']}).injectEndpoints({
  endpoints: builder => ({
    getUserProfile: builder.query<Response<GetProfileResponse>, number>({
      query: (id) => ({
        url: `user/profile/${id}`,
        method: 'GET'
      })
    }),
    getSearch: builder.query<Response<User[]>, string>({
      query: (args) => ({
        url: `user/search?name=${args}`,
        method: 'GET'
      })
    })
  })
})

export const {
  useLazyGetUserProfileQuery,
  useLazyGetSearchQuery
} = userApiSlice;
