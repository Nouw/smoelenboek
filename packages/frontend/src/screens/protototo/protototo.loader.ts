import { ActionFunction } from "react-router-dom";
import { rehydrationPromise, store } from "../../store/store";
import { protototoApiSlice } from "../../api/endpoints/protototo.api";

export const protototoBetsLoader: ActionFunction = async () => {
  await rehydrationPromise;

  const req = store.dispatch(
    protototoApiSlice.endpoints.getCurrentProtototoSeason.initiate(null),
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
