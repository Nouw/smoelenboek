import {API, Response} from "../API";
import {User} from "smoelenboek-types";

interface GetProfileResponse extends User {
   
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
    }),
		getExport: builder.query<Blob, null>({
			query: () => ({
				url: `user/export/excel`,
				method: 'GET',
				responseHandler: (response) => response.blob()
			})	
		})
  })
})

export const {
  useLazyGetUserProfileQuery,
  useLazyGetSearchQuery,
	useLazyGetExportQuery
} = userApiSlice;
