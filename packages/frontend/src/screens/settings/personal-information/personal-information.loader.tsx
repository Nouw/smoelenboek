import { ActionFunction } from "react-router-dom";
import { store } from "../../../store/store";
import { userApiSlice } from "../../../api/endpoints/user.api";

export const personalInformationLoader: ActionFunction = async () => {
  const id = store.getState().auth.id;
  
  if (!id) {
    // TODO: Change this response
    throw new Response("Something went wrong!", { status: 500 });
  }

  const req = store.dispatch(userApiSlice.endpoints.getInfo.initiate(id));

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }


} 
