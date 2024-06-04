import {Mutex} from "async-mutex";
import {BaseQueryFn, FetchArgs, fetchBaseQuery, FetchBaseQueryError} from "@reduxjs/toolkit/query";
import {AuthState, logout, setAccessToken} from "../store/feature/auth.slice";
import {RootState} from "../store/store";

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_APP_API_URL ?? "http://localhost:8080/",
  prepareHeaders: (headers, { getState }) => {
		if (headers.get('authorization') !== null) {
			return headers;
		}

		const token = (getState() as RootState).auth.accessToken;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    return headers;
  },
})

export const baseQueryReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        const state = api.getState() as AuthState;

        const refreshResult = await baseQuery({url: 'auth/refresh', body: { refreshToken: state.refreshToken }}, api, extraOptions);
        
        if (refreshResult.data) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          api.dispatch(setAccessToken(refreshResult.data.accessToken));

          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout);
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock()
      result = await baseQuery(args, api, extraOptions)
    }
  }

  return result;
}
