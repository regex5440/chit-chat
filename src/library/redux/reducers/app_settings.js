import { createSlice } from "@reduxjs/toolkit";

const defaultSetting = {
  clockHr: 12,
  darkMode: false,
  theme: {
    preferred: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    background: "",
  },
  serverTime: "",
  deviceDetails: {
    type: navigator.userAgent.toLowerCase().match(/mobile/i) ? "mobile" : "desktop",
  },
};

const appSettingsSlice = createSlice({
  name: "config",
  initialState: defaultSetting,
  reducers: {
    toggleClockHour: (state) => {
      state.clockHr = state.clockHr === 12 ? 24 : 12;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
  },
});

export default appSettingsSlice.reducer;

export const { toggleClockHour, toggleDarkMode } = appSettingsSlice.actions;
