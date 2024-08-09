import { configureStore } from "@reduxjs/toolkit";
import UserAppDataReducer from "./reducers/user_appData";
import AppConfig from "./reducers/app_settings";
import callReducer from "./reducers/call_slice";

const store = configureStore({
  reducer: {
    config: AppConfig,
    appData: UserAppDataReducer,
    call: callReducer,
  },
});

export default store;
