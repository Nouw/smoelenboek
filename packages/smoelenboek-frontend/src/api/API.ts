import { createApi } from "@reduxjs/toolkit/query/react";
import {baseQueryReauth} from "./base-query";

export interface Response<T> {
  status: "ok" | "error",
  data: T,
  message?: string,
}

export interface Error {
  message: string;
}

export const API = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryReauth,
  endpoints: () => ({})
})
