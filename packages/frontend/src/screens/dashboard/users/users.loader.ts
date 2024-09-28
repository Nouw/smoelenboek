import { ActionFunction } from "react-router-dom";
import { rehydrationPromise, store } from "../../../store/store";
import { userApiSlice } from "../../../api/endpoints/user.api";

export const usersLoader: ActionFunction = async () => {
  await rehydrationPromise;

  const req = store.dispatch(userApiSlice.endpoints.getUsers.initiate());

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}

export const userLoader: ActionFunction = async ({ params }) => {
  await rehydrationPromise;

  const req = store.dispatch(userApiSlice.endpoints.getInfo.initiate(+params.id!));

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}
