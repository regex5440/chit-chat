import axios from "axios";

const CCSignupPoint = axios.create({
  baseURL: import.meta.env.VITE_CC_ServerDomain + "/signup/api",
  withCredentials: false, //TODO: To be updated when app is deployed
});

export const setSignupAuthToken = (authToken) => {
  CCSignupPoint.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};

export default CCSignupPoint;
