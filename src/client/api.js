import axios from "axios";
import { setLoginStateToken } from "../utils";

const ChitChatServer = axios.create({
  baseURL: import.meta.env.CC_ServerDomain + "/api/",
  withCredentials: true,
});
ChitChatServer.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    console.log(error);
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const response = await (
        await fetch(`${import.meta.env.CC_ServerDomain}/api/`, {
          headers: {
            Authorization: originalRequest.headers.Authorization,
          },
        })
      ).json();
      if (response?.success) {
        setAPIHeader(response.data);
        setLoginStateToken(response.data);
        originalRequest.headers.Authorization = `Bearer ${response.data}`;
        return ChitChatServer(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export const setAPIHeader = (authToken) => {
  ChitChatServer.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};

export const SERVER_GET_PATHS = {
  my_profile: "me",
  my_connections: "connections",
};

export default ChitChatServer;
