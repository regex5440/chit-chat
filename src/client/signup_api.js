import axios from "axios";

const CCSignupPoint = axios.create({
  baseURL: import.meta.env.CC_ServerDomain + "/signup/api",
  withCredentials: true,
});

CCSignupPoint.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const setSignupAuthToken = (authToken) => {
  CCSignupPoint.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};

export default CCSignupPoint;
