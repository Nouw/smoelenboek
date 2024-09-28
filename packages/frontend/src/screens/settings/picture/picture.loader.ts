import { ActionFunction } from "react-router-dom";
import { rehydrationPromise, store } from "../../../store/store";
import { userApiSlice } from "../../../api/endpoints/user.api";

export const pictureLoader: ActionFunction = async () => {
  await rehydrationPromise;


  const req = store.dispatch(userApiSlice.endpoints.getProfilePicture.initiate());

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
