import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import ChitChatServer, { SERVER_GET_PATHS } from "../../../client/api";
import { sendMessage, updateTyping } from "../../socket.io/socket";
import { contactsChat, getUserData } from "../selectors";
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
};

export const getMyProfile = createAsyncThunk("fetchMyData", async (authToken) => {
  let response = await ChitChatServer.get(SERVER_GET_PATHS.my_profile);
  if (response.data) return { ...response.data, authToken };
  setLoginStateToken("");
  return {};
});

export const getConnections = createAsyncThunk("fetchContacts", async () => {
  let { data } = await ChitChatServer.get(SERVER_GET_PATHS.my_connections);
  if (Object.keys(data).length > 0) return data;
  return "";
});
export const addMessageThunk = createAsyncThunk("sendMessage", async (messageObject, { getState }) => {
  const { chat_id } = contactsChat(getState());
  const {
    data: { id: sender_id },
  } = getUserData(getState());
  await sendMessage(chat_id, Object.assign({}, messageObject, { sender_id }));
});

export const updateTypingThunk = createAsyncThunk("updateTyping", async (isTyping, { getState }) => {
  const { chat_id } = contactsChat(getState());
  const {
    data: { id: authorId },
  } = getUserData(getState());
  await updateTyping(chat_id, { authorId, isTyping });
});

export const userSearchThunk = createAsyncThunk("userSearch", async (query) => {
  const {
    data: { success, data },
  } = await ChitChatServer.get(`findUser?q=${encodeURIComponent(query)}`);
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
      state.selectedContact.contactId = action.payload;
      state.selectedContact.isAvailable = true;
    },
    addTypingAuthors: (state, action) => {
      state.chats[action.payload.chat_id].authors_typing = action.payload.authors_typing;
    },
    updateChat: (state, { payload: update }) => {
      console.log(update);
      state.chats[update.chat_id].last_updated = update.last_updated;
      state.chats[update.chat_id].messages.push(update.message);
    },
    updateSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Get Connections
    builder
      .addCase(getConnections.pending, (state) => {
        state.contacts.loading = true;
      })
      .addCase(getConnections.fulfilled, (state, action) => {
        if (action.payload) {
          state.contacts.hasData = true;
          state.contacts.data = action.payload.contacts;
          state.chats = action.payload.chats.reduce((prevChatObj, chatObj) => ({ ...prevChatObj, [chatObj.chat_id]: chatObj }), {});
        }
        state.contacts.loading = false;
      })
      .addCase(getConnections.rejected, (state) => {
        state.contacts.loading = false;
      });
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
        let chatId = state.contacts.data[state.selectedContact.contactId].chat_id;
        state.chats[chatId].last_updated = meta.arg.timestamp;
        state.chats[chatId].messages.push(Object.assign({}, meta.arg, { sender_id: state.user.data.id }));
      })
      .addCase(addMessageThunk.fulfilled, (state, action) => {
        console.log("sendMessageConfirmed", action);
        // To add a tick mark, if message is send to server
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

export const { selectContact, addTypingAuthors, updateChat, updateSearchQuery } = userAppDataSlice.actions;

export default userAppDataSlice.reducer;
