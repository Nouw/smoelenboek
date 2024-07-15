import { Role } from "backend";
import { API } from "../API";

export type LoginResponse = {
  access_token: string;
  role: Role;
  refresh_token: string;
  id: number;
};

const authApiSlice = API.enhanceEndpoints({
  addTagTypes: ["Auth"],
}).injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>(
      {
        query: (body) => ({
          url: `auth/login`,
          method: "POST",
          body,
        }),
      },
    ),
    changePassword: builder.mutation<
      void,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "auth/password/change",
        method: "POST",
        body,
      }),
    }),
    requestResetPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({
        url: "auth/password/request-reset",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<void, { token: string; password: string }>({
      query: ({ token, password }) => ({
        url: `auth/password/reset/${token}`,
        method: "POST",
        body: { password },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useChangePasswordMutation,
  useRequestResetPasswordMutation,
  useResetPasswordMutation,
} = authApiSlice;
