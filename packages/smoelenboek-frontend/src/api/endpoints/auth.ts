import {API, Response} from "../API";
import {Role, User} from "smoelenboek-types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  refreshToken: string;
  accessToken: string;
}

interface PostChangePassword {
  currentPassword: string;
  newPassword: string;
}

export const authApiSlice = API.enhanceEndpoints({ addTagTypes: ['Auth']}).injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation<Response<LoginResponse>, LoginRequest>({
      query: (data) => ({
        url: 'auth/login',
        method: 'POST',
        body: {
          email: data.email,
          password: data.password
        }
      })
    }),
    getRoles: builder.query<Response<Role[]>, void>({
      query: () => ({
        url: 'auth/permissions',
        method: 'GET',
      })
    }),
    changePassword: builder.mutation<Response<string>, PostChangePassword>({
      query: (body) => ({
        url: 'auth/password/change',
        method: 'POST',
        body,
      })
    }),
    getUserInformation: builder.query<Response<User>, number>({
      query: (id) => ({
        url: `user/info/${id}`,
        method: 'GET'
      })
    }),
    postProfilePicture: builder.mutation<Response<string>, FormData>({
      query: (body) => ({
        url: 'user/picture',
        method: 'POST',
        body,
      })
    }),
    getProfilePicture: builder.query<Response<string>, void>({
      query: () => ({
        url: 'user/picture',
        method: 'GET'
      })
    }),
    postResetPassword: builder.mutation<Response<void>, string>({
      query: (email) => ({
        url: 'auth/password/reset',
        method: 'POST',
        body: {
          email
        }
      })
    })
  })
})

export const {
  useLoginMutation,
  useLazyGetRolesQuery,
  useChangePasswordMutation,
  useGetUserInformationQuery,
  usePostProfilePictureMutation,
  useGetProfilePictureQuery,
  useLazyGetProfilePictureQuery,
  usePostResetPasswordMutation
} = authApiSlice;
