import {API, Response} from "../API.ts";
import {Activity, Form, FormAnswer} from "smoelenboek-types";

interface PostActivityRequest {
  activity: Partial<Activity>
  form: Partial<Form>;
}

interface PostRegistrationRequest {
  id: string;
  data: {
    [key: string]: string | string[];
  },
  anonymous?: boolean;
}

export const activityApiSlice = API.enhanceEndpoints({ addTagTypes: ['Activity']}).injectEndpoints({
  endpoints: builder => ({
    createActivity: builder.mutation<string, PostActivityRequest>({
      query: (data) => ({
        url: 'activity/',
        method: 'POST',
        body: {
          activity: data.activity,
          form: data.form,
        }
      })
    }),
    getActivities: builder.query<Response<Activity[]>, undefined>({
      query: () => ({
        url: 'activity/',
        method: 'GET',
      })
    }),
    getActivity: builder.query<Response<Activity>, number>({
      query: (id) => ({
        url: `activity/${id}`,
        method: 'GET'
      })
    }),
    getForm: builder.query<Response<Form>, string>({
      query: (id) => ({
        url: `activity/form/${id}`,
        method: 'GET'
      })
    }),
    postRegistration: builder.mutation<Response<null>, PostRegistrationRequest>({
      query: (data) => ({
        url: `activity/register/${data.id}`,
        method: 'POST',
        body: data.data,
				prepareHeaders: (headers: Headers) => {
					if (!data.anonymous) {
						return headers;
					}

					headers.set("Authorization", "Hello world!")

					return headers;
				}	

      })
    }),
    postFormSheet: builder.mutation<Response<{ sheetId: string }>, string>({
      query: (id) => ({
        url: `activity/form/sheet/${id}`,
        method: 'POST',
      })
    }),
    getFormResponses: builder.query<Response<FormAnswer[]>, string>({
      query: (id) => ({
        url: `activity/responses/${id}`,
        method: 'GET'
      })
    })
  })
});

export const {
  useCreateActivityMutation,
  useGetActivitiesQuery,
  useGetActivityQuery,
  useLazyGetFormQuery,
  usePostRegistrationMutation,
  usePostFormSheetMutation,
  useLazyGetFormResponsesQuery,
} = activityApiSlice;
