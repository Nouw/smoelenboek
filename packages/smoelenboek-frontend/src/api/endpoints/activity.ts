import {API, Response} from "../API.ts";
import {Activity, Form} from "smoelenboek-types";

interface PostActivityRequest {
  activity: Partial<Activity>
  form: Partial<Form>;
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
    })
  })
});

export const {
  useCreateActivityMutation,
  useGetActivitiesQuery,
  useGetActivityQuery,
  useLazyGetFormQuery
} = activityApiSlice;
