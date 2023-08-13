import axios from "axios";

const ChitChatServer = axios.create({
  baseURL: import.meta.env.CC_ServerDomain + "/api/",
  withCredentials: true,
});

export const setAPIHeader = (authToken) => {
  ChitChatServer.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};

export const SERVER_GET_PATHS = {
  my_profile: "me",
  my_connections: "connections",
};

export default ChitChatServer;
