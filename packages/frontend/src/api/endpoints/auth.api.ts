import { Role } from "backend";
import { API } from "../API";

export type LoginResponse = {
  access_token: string;
  role: Role;
  refresh_token: string;
  id: number;
}

const authApiSlice = API.enhanceEndpoints({ addTagTypes: ["Auth"] }).injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation<LoginResponse, { email: string, password: string }>({
      query: (body) => ({
        url: `auth/login`,
        method: 'POST',
        body,
      })
    }),
    changePassword: builder.mutation<void, { currentPassword: string, newPassword: string}>({
      query: (body) => ({
        url: 'auth/password/change',
        method: 'POST',
        body,
      })
    })
  })
});

export const {
  useLoginMutation,
  useChangePasswordMutation,
} = authApiSlice;
