import { ApiResponse } from "smoelenboek-types";
import { API, Response } from "../API.ts";
import { Activity, Form, FormAnswer } from "smoelenboek-types";

interface PostActivityRequest {
  activity: Partial<Activity>;
  form: Partial<Form>;
}

interface PostRegistrationRequest {
  id: string;
  data: {
    [key: string]: string | string[];
  };
  anonymous?: boolean;
}

interface GetRegistrationResponse {
	question: {
		id: string;
	};
	value: string;
}

export const activityApiSlice = API.enhanceEndpoints({
  addTagTypes: ["Activity"],
}).injectEndpoints({
  endpoints: (builder) => ({
    createActivity: builder.mutation<ApiResponse<null>, PostActivityRequest>({
      query: (data) => ({
        url: "activity/",
        method: "POST",
        body: {
          activity: data.activity,
          form: data.form,
        },
      }),
    }),
    getActivities: builder.query<ApiResponse<Activity[]>, undefined>({
      query: () => ({
        url: "activity/",
        method: "GET",
      }),
    }),
    getActivity: builder.query<Response<Activity>, number>({
      query: (id) => ({
        url: `activity/${id}`,
        method: "GET",
      }),
    }),
    getForm: builder.query<Response<Form>, string>({
      query: (id) => ({
        url: `activity/form/${id}`,
        method: "GET",
      }),
    }),
    postRegistration: builder.mutation<Response<null>, PostRegistrationRequest>(
      {
				// @ts-ignore really weird error gets thrown otherwise
        query: (data) => ({
          url: `activity/register/${data.id}`,
          method: "POST",
          body: data.data,
					headers: data.anonymous ? { Authorization: data.data.email } : undefined,
        }),
      },
    ),
    postFormSheet: builder.mutation<Response<{ sheetId: string }>, string>({
      query: (id) => ({
        url: `activity/form/sheet/${id}`,
        method: "POST",
      }),
    }),
    getFormResponses: builder.query<Response<FormAnswer[]>, string>({
      query: (id) => ({
        url: `activity/responses/${id}`,
        method: "GET",
      }),
    }),
    updateActivity: builder.mutation<
      ApiResponse<null>,
      { id: number; activity: Partial<Activity> }
    >({
      query: ({ id, activity }) => ({
        url: `activity/${id}`,
        method: "PUT",
        body: activity,
      }),
    }),
    deleteActivity: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `activity/${id}`,
        method: "DELETE",
      }),
    }),
    getRegistration: builder.query<ApiResponse<GetRegistrationResponse[]>, { id: string, email?: string }>({
      query: ({ id, email }) => ({
        url: `activity/registration/${id}`,
        method: "GET",
				headers: {
					Authorization: email 
				}	
      }),
    }),
		getParticipants: builder.query<ApiResponse<FormAnswer[]>, number | string>({
			query: (id) => ({
				url: `activity/participants/${id}`,
				method: "GET"
			})
		}),
		postFormSyncsheet: builder.mutation<ApiResponse<null>, string>({
			query: (id) => ({
				url: `activity/form/sheet/sync/${id}`,
				method: "POST"
			})
		}),
		deleteResponse: builder.mutation<ApiResponse<null>, string>({
			query: (id) => ({
				url: `activity/registration/${id}`,
				method: "DELETE"
			})
		}),
		updateActivitySettings: builder.mutation<ApiResponse<null>, Partial<Activity>>({
			query: (activity) => ({
				url: `activity/settings/${activity.id}`,
				method: "PUT",
				body: {
					...activity,	
				}
			})
		}),
		deleteSelfResponse: builder.mutation<ApiResponse<null>, string>({
			query: (id) => ({
				url: `activity/response/${id}`,
				method: "DELETE" // TODO: Should probably fix the headers??
			})
		}),
    getManagedActivities: builder.query<ApiResponse<Activity[]>, null>({
      query: () => ({
        url: "activity/managed/list",
        method: "GET"
      })
    })
  }),
});

export const {
  useCreateActivityMutation,
  useGetActivitiesQuery,
  useGetActivityQuery,
  useLazyGetFormQuery,
  useGetFormQuery,
  usePostRegistrationMutation,
  usePostFormSheetMutation,
  useLazyGetFormResponsesQuery,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
	useLazyGetRegistrationQuery,
	useGetParticipantsQuery,
	usePostFormSyncsheetMutation,
	useGetFormResponsesQuery,
	useDeleteResponseMutation,
	useUpdateActivitySettingsMutation,
	useDeleteSelfResponseMutation,
  useLazyGetManagedActivitiesQuery,
} = activityApiSlice;
