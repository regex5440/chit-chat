import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import ChitChatServer, { SERVER_GET_PATHS } from "../../../client/api";
import { sendMessage, updateTyping } from "../../socket.io/socket";
import { getTempConnection, getUserData, selectedContactChatId } from "../selectors";
import { setLoginStateToken } from "../../../utils";

const appDataInitialState = {
  search: {
    query: "",
    loading: false,
    hasData: false,
    data: {
      users: [],
      groups: [],
    },
  },
  user: {
    loading: false,
    hasData: false,
    data: {},
  },
  selectedContact: {
    isAvailable: false,
    contactId: null,
    fetchedAllMessages: true,
  },
  contacts: {
    loading: false,
    hasData: false,
    data: {},
  },
  chats: {},
  temp_contact: null,
};

export const getMyProfile = createAsyncThunk("fetchMyData", async (authToken) => {
  let { success, data } = await ChitChatServer.get(SERVER_GET_PATHS.my_profile);
  if (success) return { ...data, authToken };
  setLoginStateToken("");
  return "";
});

export const addMessageThunk = createAsyncThunk("sendMessage", async (messageObject, { getState }) => {
  const chat_id = selectedContactChatId(getState());
  const {
    data: { id: sender_id },
  } = getUserData(getState());
  messageObject.sender_id = sender_id;

  if (!chat_id) {
    const tempContact = getTempConnection(getState());
    await sendMessage(tempContact.id, messageObject, true);
  } else {
    await sendMessage(chat_id, messageObject);
  }
});

export const updateTypingThunk = createAsyncThunk("updateTyping", async (isTyping, { getState }) => {
  const chat_id = selectedContactChatId(getState());
  const {
    data: { id: authorId },
  } = getUserData(getState());
  if (!chat_id) {
    return;
  }
  await updateTyping(chat_id, { authorId, isTyping });
});

export const userSearchThunk = createAsyncThunk("userSearch", async (query) => {
  const { success, data } = await ChitChatServer.get(`findUser?q=${encodeURIComponent(query)}`);
  if (success) {
    return data;
  }
  return false;
});

const userAppDataSlice = createSlice({
  name: "user_appData",
  initialState: appDataInitialState,
  reducers: {
    selectContact: (state, action) => {
      if (action.payload !== state.temp_contact?.id) state.temp_contact = null;
      state.selectedContact.contactId = action.payload;
      state.selectedContact.isAvailable = true;
    },
    addTypingAuthors: (state, action) => {
      state.chats[action.payload.chat_id].authors_typing = action.payload.authors_typing;
    },
    addInitialData: (state, { payload: { hasData, chats, connections } }) => {
      if (hasData) {
        state.contacts.hasData = hasData;
        state.contacts.data = connections;
        state.chats = chats.reduce((prevChatObj, chatObj) => ({ ...prevChatObj, [chatObj.chat_id]: chatObj }), {});
      }
      state.contacts.loading = false;
    },
    updateChat: (state, { payload: update }) => {
      console.log(update);
      state.chats[update.chat_id].last_updated = update.last_updated;
      state.chats[update.chat_id].messages.push(update.message);
    },
    updateSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    setTempConnection: (state, action) => {
      state.temp_contact = state.search.data?.users?.find((user) => user.id === action.payload);
    },
    removeTempConnection: (state, action) => {
      state.temp_contact = null;
    },
    addNewConnectionRequested: (state, { payload: { chat, connectionProfile } }) => {
      state.chats[chat.chat_id] = chat;
      state.contacts.data[connectionProfile.id] = connectionProfile;
      state.temp_contact = null;
      state.contacts.hasData = true;
    },
  },
  extraReducers: (builder) => {
    // Get User Profile
    builder
      .addCase(getMyProfile.pending, (state) => {
        state.user.loading = true;
      })
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.user.loading = false;
        if (action.payload) {
          state.user.hasData = true;
          state.user.data = action.payload;
        }
      })
      .addCase(getMyProfile.rejected, (state) => {
        state.user.loading = false;
      });

    builder
      .addCase(addMessageThunk.pending, (state, { meta }) => {
        let chatId = selectedContactChatId({ appData: state });
        if (chatId) {
          state.chats[chatId].last_updated = meta.arg.timestamp;
          state.chats[chatId].messages.push(Object.assign({}, meta.arg, { sender_id: state.user.data.id }));
        }
      })
      .addCase(addMessageThunk.fulfilled, (state, action) => {
        console.log("sendMessageConfirmed", action);
        // To add a tick mark, if message is send to server
      })
      .addCase(addMessageThunk.rejected, (state, action) => {
        console.log("Unable to send message", action);
      });

    builder
      .addCase(userSearchThunk.pending, (state) => {
        state.search.loading = true;
      })
      .addCase(userSearchThunk.fulfilled, (state, { payload }) => {
        state.search.loading = false;
        state.search.hasData = payload.hasData;
        state.search.data.users = payload.users;
        state.search.data.groups = payload.groups;
      })
      .addCase(userSearchThunk.rejected, (state) => {
        state.search.loading = false;
      });
  },
});

export const { selectContact, addTypingAuthors, addInitialData, updateChat, updateSearchQuery, setTempConnection, removeTempConnection, addNewConnectionRequested } = userAppDataSlice.actions;

export default userAppDataSlice.reducer;
