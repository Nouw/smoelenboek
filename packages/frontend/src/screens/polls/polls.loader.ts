import { ActionFunction } from "react-router-dom";
import { rehydrationPromise, store } from "../../store/store";
import { propollApiSlice } from "../../api/endpoints/propoll.api";

export const pollsLoader: ActionFunction = async () => {
  await rehydrationPromise;

  const req = store.dispatch(propollApiSlice.endpoints.getActivePolls.initiate());

  try {
    return await req.unwrap();
  } catch (e) {
    console.log(e);
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe();
  }
};
