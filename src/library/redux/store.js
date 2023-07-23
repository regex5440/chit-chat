import { configureStore } from "@reduxjs/toolkit";
import UserAppDataReducer from "./reducers/user_appData";
import AppConfig from "./reducers/app_settings";

const store = configureStore({
  reducer: {
    config: AppConfig,
    appData: UserAppDataReducer,
  },
});

export default store;
