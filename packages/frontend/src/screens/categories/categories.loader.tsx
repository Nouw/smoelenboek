import { ActionFunction } from "react-router-dom";
import { rehydrationPromise, store } from "../../store/store"
import { categoriesApiSlice } from "../../api/endpoints/categories.api";

export const categoriesLoader: ActionFunction = async () => {
  await rehydrationPromise;

  const req = store.dispatch(categoriesApiSlice.endpoints.getCategories.initiate(undefined as void, { forceRefetch: true }));

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}

