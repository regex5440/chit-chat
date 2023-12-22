import { addParticipants, clearChat, deleteContact, updateSelectedContact, addTypingAuthors, addInitialData, updateChat, updateUserStatus, updateChatSeenStatus, updateSearchQuery, getMyProfile, setTempConnection, removeTempConnection, addNewConnectionRequested, resetSocketData, acceptRequestThunk, updateStatusThunk, clearChatThunk, removeConnectionThunk, addMessageThunk, updateTypingThunk, userSearchThunk, sendMessageSeenThunk } from "./user_appData";

import { toggleClockHour, toggleDarkMode, updateAttachmentMetadata, updateSelectedFiles } from "./app_settings";

import { resetCallState, showCallerComponent, setDuration, minimizeComponent, setCallStatus, enableAudio, enableVideo, setUser } from "./call_slice";

export {
  // AppSettings
  toggleClockHour,
  toggleDarkMode,
  updateSelectedFiles,
  updateAttachmentMetadata,
};

export { resetCallState, showCallerComponent, setDuration, minimizeComponent, setCallStatus, enableAudio, enableVideo, setUser };

export {
  // User AppData Slice
  addParticipants,
  addInitialData,
  clearChat,
  deleteContact,
  getMyProfile,
  updateSelectedContact,
  addTypingAuthors,
  updateChat,
  updateUserStatus,
  updateChatSeenStatus,
  updateSearchQuery,
  setTempConnection,
  removeTempConnection,
  addNewConnectionRequested,
  resetSocketData,

  //Thunks
  acceptRequestThunk,
  updateStatusThunk,
  clearChatThunk,
  addMessageThunk,
  updateTypingThunk,
  userSearchThunk,
  sendMessageSeenThunk,
  removeConnectionThunk,
};
