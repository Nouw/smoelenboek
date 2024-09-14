import { ActionFunction } from "react-router-dom";
import { store } from "../../../store/store";
import { seasonsApiSlice } from "../../../api/endpoints/seasons.api";

export const seasonsLoader: ActionFunction = async () => {
  const req = store.dispatch(seasonsApiSlice.endpoints.getSeasons.initiate());

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    console.log(e);
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}

export const seasonLoader: ActionFunction = async ({ params }) => {
  const req = store.dispatch(seasonsApiSlice.endpoints.getSeason.initiate(+params.id!));

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    console.log(e);
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }

}