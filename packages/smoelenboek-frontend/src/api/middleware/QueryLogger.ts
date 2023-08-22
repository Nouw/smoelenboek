import {isRejectedWithValue, Middleware} from "@reduxjs/toolkit";

export const QueryLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    console.log(action);
  }

  return next(action);
}
