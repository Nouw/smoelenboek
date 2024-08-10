import { API } from "../API";
import { UserExtended } from "../../screens/profiles/profile";
import { CreateUserDto, UpdateUserDto, User } from "backend";

export const userApiSlice = API.enhanceEndpoints({
  addTagTypes: ["User"],
}).injectEndpoints({
  endpoints: (builder) => ({
    getProfilePicture: builder.query<{ picture: string }, void>({
      query: () => ({
        url: "users/user/picture",
        method: "GET",
      }),
    }),
    getProfile: builder.query<UserExtended, number>({
      query: (id) => ({
        url: `users/profile/${id}`,
        method: "GET",
      }),
    }),
    getInfo: builder.query<User, number>({
      query: (id) => ({
        url: `users/${id}`,
        method: "GET",
      }),
    }),
    updateInfo: builder.mutation<User, UpdateUserDto & { id: number }>({
      query: (body) => ({
        url: `users/${body.id}`,
        method: "PATCH",
        body,
      }),
    }),
    postProfilePicture: builder.mutation<User, FormData>({
      query: (body) => ({
        url: "users/user/picture/upload",
        method: "POST",
        body,
      }),
    }),
    getUsers: builder.query<User[], void>({
      query: () => ({
        url: "users/",
        method: "GET",
      }),
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `users/${id}`,
        method: "DELETE",
      }),
    }),
    createUser: builder.mutation<User, CreateUserDto>({
      query: (body) => ({
        url: "users",
        method: "POST",
        body,
      }),
    }),
    searchUser: builder.query<User[], string>({
      query: (param) => ({
        url: `users/user/search?name=${param}`,
        method: "GET",
      }),
    }),
    postImportUsers: builder.mutation<void, FormData>({
      query: (body) => ({
        url: "users/import/excel",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLazyGetProfilePictureQuery,
  useUpdateInfoMutation,
  usePostProfilePictureMutation,
  useDeleteUserMutation,
  useCreateUserMutation,
  useLazySearchUserQuery,
  usePostImportUsersMutation,
} = userApiSlice;
