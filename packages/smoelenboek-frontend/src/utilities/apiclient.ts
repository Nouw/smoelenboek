import axios from "axios";
import history from "./history";
import {AuthState} from "../store/feature/auth.slice";

const apiclient = axios;

apiclient.defaults.baseURL = import.meta.env.VITE_APP_API_URL ?? "http://localhost:8080";

apiclient.interceptors.request.use((config) => {
  // Skip checking if logging in
  if (config.url === "auth/login") {
    return config;
  }

  const authStored = localStorage.getItem("persist:auth");

  if (authStored) {
    const auth: AuthState = JSON.parse(authStored);

    if (auth.accessToken) {
      // Retarded replace is needed because for some reason extra qoutes are added by redux-persist (face-palm)
      config.headers.setAuthorization(auth.accessToken.replace(/['"]+/g, ''));

      return config;
    }

  }

  localStorage.clear();

  return config;
})

apiclient.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response ? error.response.status : null;
    const originalConfig = error.config;

    if ((status === 401) && !originalConfig._retry) {
      originalConfig._retry = true;

      const authStored = localStorage.getItem("persist:auth");

      if (!authStored) {
        history.replace('/login');
        localStorage.clear();
        return Promise.reject(error);
      }

      const auth: AuthState = JSON.parse(authStored);

      if (!auth.refreshToken) {
        history.replace('/login');
        localStorage.clear();
        return Promise.reject(error);
      }

      try {
        const rs = await axios.post(`${apiclient.defaults.baseURL}/auth/refresh`, {
          refreshToken: auth.refreshToken.replace(/['"]+/g, ''),
        });

        const {accessToken} = rs.data;

        auth.accessToken = accessToken;

        localStorage.setItem("persist:auth", JSON.stringify(auth));

        return apiclient(originalConfig);
      } catch (e) {
        localStorage.clear();
        window.location.reload();
      }
    }

    return Promise.reject(error);
  },
);

export default axios;
