import { ActionFunction } from "react-router-dom";
import { rehydrationPromise, store } from "../../../store/store.ts";
import { protototoApiSlice } from "../../../api/endpoints/protototo.api.ts";

export const seasonsLoader: ActionFunction = async () => {
  await rehydrationPromise;

  const req = store.dispatch(
    protototoApiSlice.endpoints.getProtototoSeasons.initiate(),
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

export const seasonLoader: ActionFunction = async ({ params }) => {
  const req = store.dispatch(
    protototoApiSlice.endpoints.getProtototoSeason.initiate(+params.id!)
  )

  try {
    return await req.unwrap();
  } catch (e) {
    console.log(e);
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe();
  }

}
