import { ActionFunction } from "react-router-dom";
import { store } from "../../store/store";
import { documentsApiSlice } from "../../api/endpoints/documents.api";

export const matchesLoader: ActionFunction = async ({ params }) => {
  const req = store.dispatch(
    documentsApiSlice.endpoints.getDocuments.initiate(+params.id!, {
      forceRefetch: true,
    }),
  );

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe();
  }
};
