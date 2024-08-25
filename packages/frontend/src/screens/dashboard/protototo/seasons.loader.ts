import { ActionFunction } from "react-router-dom";
import { store } from "../../../store/store.ts";
import { protototoApiSlice } from "../../../api/endpoints/protototo.api.ts";

export const seasonsLoader: ActionFunction = async () => {
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
