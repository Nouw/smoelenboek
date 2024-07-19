import { Category, Document } from "backend";
import { API } from "../API";

export const documentsApiSlice = API.enhanceEndpoints({
  addTagTypes: ["Documents"],
}).injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<
      { category: Category; documents: Document[] },
      number
    >({
      query: (id) => ({
        url: `documents/${id}`,
        method: "GET",
      }),
    }),
    uploadDocuments: builder.mutation<
      Document[],
      { id: number; body: FormData }
    >({
      query: ({ id, body }) => ({
        url: `documents/upload/${id}`,
        method: "POST",
        body,
      }),
    }),
    deleteDocuments: builder.mutation<void, number[]>({
      query: (ids) => ({
        url: `documents/`,
        method: "DELETE",
        body: {
          ids,
        },
      }),
    }),
  }),
});

export const { useUploadDocumentsMutation, useDeleteDocumentsMutation } =
  documentsApiSlice;
