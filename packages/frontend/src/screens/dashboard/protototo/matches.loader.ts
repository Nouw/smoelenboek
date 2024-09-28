import { ActionFunction } from "react-router-dom";
import { rehydrationPromise, store } from "../../../store/store.ts";
import { protototoApiSlice } from "../../../api/endpoints/protototo.api.ts";

export const matchesLoader: ActionFunction = async ({ params }) => {
  await rehydrationPromise;

  const req = store.dispatch(
    protototoApiSlice.endpoints.getMatches.initiate(+params.id!),
  );

  try {
    return await req.unwrap();
  } catch (e) {
    console.log(e);
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe();
  }
};
