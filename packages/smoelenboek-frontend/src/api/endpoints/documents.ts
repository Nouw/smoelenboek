import {API, Response} from "../API";
import {Category, File} from "smoelenboek-types";

interface GetDocumentsCategories {
  categories: Category[];
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface PostCategory {
  id?: number;
  name?: string;
  type?: "photos" | "documents";
}

interface UploadResponse extends Partial<File> {
  originalName?: string;
  category: Category;
}

export const documentsApiSlice = API.enhanceEndpoints({ addTagTypes: ['Documents']}).injectEndpoints({
  endpoints: builder => ({
    documentsCategories: builder.query<Response<GetDocumentsCategories | Category[]>, boolean>({
      query: (raw) => ({
        url: `documents/?raw=${raw}`,
        method: 'GET'
      })
    }),
    documentsCreateCategory: builder.mutation<Response<Category>, PostCategory>({
      query: (data) => ({
        url: `documents/category`,
        method: 'POST',
        body: data,
      })
    }),
    documentsUpdateCategory: builder.mutation<Response<Category>, PostCategory>({
      query: (data) => ({
        url: `documents/category`,
        method: 'PUT',
        body: data
      })
    }),
    documentsGetFiles: builder.query<Response<Category[]>, number>({
      query: (id) => ({
        url: `documents/files/${id}`,
        method: 'GET'
      })
    }),
    documentsUploadFiles: builder.mutation<Response<UploadResponse[]>, FormData>({
      query: (data) => ({
        url: `documents/upload`,
        method: 'POST',
        body: data,
      })
    }),
    documentsDeleteFiles: builder.mutation<Response<null>, number[]>({
      query: (data) => ({
        url: "documents/",
        method: "DELETE",
        body: {
          docs: data
        }
      })
    }),
    documentsDeleteCategory: builder.mutation<Response<null>, number>({
      query: (id) => ({
        url: `documents/category`,
        method: "DELETE",
        body: {
          id
        }
      })
    })
  })
});

export const {
  useDocumentsCategoriesQuery,
  useLazyDocumentsCategoriesQuery,
  useDocumentsCreateCategoryMutation,
  useDocumentsUpdateCategoryMutation,
  useDocumentsGetFilesQuery,
  useLazyDocumentsGetFilesQuery,
  useDocumentsUploadFilesMutation,
  useDocumentsDeleteFilesMutation,
  useDocumentsDeleteCategoryMutation
} = documentsApiSlice;
