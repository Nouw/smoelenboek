import { Category, CreateCategoryDto, UpdateCategoryDto } from "backend";
import { API } from "../API";

export const categoriesApiSlice = API.enhanceEndpoints({ addTagTypes: ["Categories"] }).injectEndpoints({
  endpoints: builder => ({
    getCategories: builder.query<Category[], void>({
      query: () => ({
        url: "categories",
        method: "GET",
      })
    }),
    createCategory: builder.mutation<Category, CreateCategoryDto>({
      query: (body) => ({
        url: "categories",
        method: "POST",
        body,
      })
    }),
    updateCategory: builder.mutation<Category, {id: number, body: UpdateCategoryDto}>({
      query: ({ id, body }) => ({
        url: `categories/${id}`,
        method: "PATCH",
        body,
      }) 
    })
    //getTeam: builder.query<Team, number>({
    //  query: (param) => ({
    //    url: `teams/${param}`,
    //    method: 'GET'
    //  })
    //})
  })
});

export const { useCreateCategoryMutation, useUpdateCategoryMutation } = categoriesApiSlice;
