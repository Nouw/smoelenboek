import { API, Response } from "../API";

export const jobApiSlice = API.enhanceEndpoints({ addTagTypes: ["job"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      jobSyncTeamPhotos: builder.mutation<Response<void>, void>({
        query: () => ({
          url: "job/teamPhoto",
          method: "POST",
        }),
      }),
    }),
  });

export const { useJobSyncTeamPhotosMutation } = jobApiSlice;
