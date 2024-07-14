import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryReauth } from "./base-query";

export const API = createApi({
  reducerPath: "api",
  baseQuery: baseQueryReauth,
  endpoints: () => ({})
})
