import { createSlice } from "@reduxjs/toolkit";
import { CALL_STATUS } from "../../../utils/enums";

/**
 * @typedef {Object} initialState
 * @property {'connecting'|'connected'|'disconnected'|'rejected'|'idle'} callStatus.state
 * @property {number} callStatus.duration - Duration of the call in seconds
 * @property {string} connectedUser - Id of the user to which call is started for
 * @property {Object.<string,*>}
 */
const initialState = {
  callUI: {
    showCaller: false,
    userInitiated: false,
    isMinimized: false,
  },
  controls: {
    audioEnabled: true,
    videoEnabled: false,
  },
  callStatus: {
    state: CALL_STATUS.IDLE,
  },
  connectedUser: {
    userId: null,
    chatId: null,
  },
  qualityControl: {
    height: window.innerHeight,
    width: window.innerWidth,
  },
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    /**
     * @typedef {Object} Payload
     * @property {boolean} byUser
     * @property {'audio'|'video'} callType
     * @property {string} contactId
     * @property {string} chatId
     */

    /**
     * @typedef {Object} Action
     * @property {(Payload|boolean)} payload
     */
    /**
     * Redux slice reducer function
     * @param {Action} action - The dispatched action
     */
    showCallerComponent: (state, action) => {
      if (action.payload) {
        state.callUI.showCaller = true;
        state.callUI.userInitiated = action.payload.byUser || false;
        if (action.payload.callType === "video") {
          state.controls.videoEnabled = true;
        }
        if (action.payload.contactId && action.payload.chatId) {
          state.connectedUser.userId = action.payload.contactId;
          state.connectedUser.chatId = action.payload.chatId;
        }
      } else {
        state = initialState;
      }
    },
    /**
     *
     * @param {boolean} action
     */
    minimizeComponent: (state, action) => {
      state.callUI.isMinimized = action.payload;
    },
    enableAudio: (state, action) => {
      state.controls.audioEnabled = action.payload || false;
    },
    enableVideo: (state, action) => {
      state.controls.videoEnabled = action.payload || false;
    },
    setCallStatus: (state, action) => {
      state.callStatus.state = action.payload;
    },
    setUser: (state, action) => {
      (state.connectedUser.userId = action.payload.contactId), (state.connectedUser.chatId = action.payload.chatId);
    },
    resetCallState: (state, action) => {
      state.callStatus = initialState.callStatus;
      state.callUI = initialState.callUI;
      state.connectedUser = initialState.connectedUser;
      state.controls = initialState.controls;
      state.durationInterval = initialState.durationInterval;
      state.qualityControl = initialState.qualityControl;
    },
  },
});

export const { resetCallState, enableAudio, enableVideo, showCallerComponent, minimizeComponent, setCallStatus, setUser } = callSlice.actions;

export default callSlice.reducer;
