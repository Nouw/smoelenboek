import { ActionFunction } from "react-router-dom";
import { committeesApiSlice } from "../../api/endpoints/committees.api";
import { store } from "../../store/store";

export const committeesLoader: ActionFunction = async () => {
  const req = store.dispatch(committeesApiSlice.endpoints.getCommittees.initiate());

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}

export const committeeInfoLoader: ActionFunction = async ({ params }) => {
  const req = store.dispatch(committeesApiSlice.endpoints.getCommittee.initiate(+params.id!, { forceRefetch: true }));

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }

}
