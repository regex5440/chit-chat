import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import ChitChatServer, { SERVER_GET_PATHS } from "../../../client/api";
import { acceptRequest, clearChatSocket, deleteMessageSocket, editMessage, removeConnection, sendMessage, sendMessageSeenUpdate, statusUpdate, updateTyping } from "../../socket.io/socket";
import { contactsChat, getSelectedContact, getUserData, selectedContactChatId } from "../selectors";
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
  let { success, data } = await ChitChatServer.get(SERVER_GET_PATHS.my_profile, { timeout: 5000 });
  if (success) return { ...data, authToken };
  setLoginStateToken("");
  return "";
});

export const addMessageThunk = createAsyncThunk("sendMessage", async (messageObject, { getState }) => {
  const { chat_id, participants } = contactsChat(getState());
  const selectedId = getSelectedContact(getState());
  const {
    data: { id: sender_id },
  } = getUserData(getState());
  messageObject.sender_id = sender_id;

  const data = await sendMessage({ chat_id, receiverId: selectedId.contactId }, messageObject, !chat_id ? true : false);

  if (participants && !participants.includes(sender_id)) {
    // User accepted the request by sending a message
    acceptRequest(chat_id, sender_id);
    return { accepted: true, chatId: chat_id, id: sender_id, ...data };
  }
  return data;
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

export const sendMessageSeenThunk = createAsyncThunk("sendSeenUpdate", async ({ chat_id, toUserId, messageId }, { getState }) => {
  const {
    data: { id },
  } = getUserData(getState());
  sendMessageSeenUpdate(chat_id, id, toUserId, messageId);
  return { id };
});

export const userSearchThunk = createAsyncThunk("userSearch", async (query) => {
  const { success, data } = await ChitChatServer.get(`findUser?q=${encodeURIComponent(query)}`);
  if (success) {
    return data;
  }
  return false;
});

export const clearChatThunk = createAsyncThunk("clearAllMsgs", async ({ chatId, toId }, { getState }) => {
  const {
    data: { id: fromContactId },
  } = getUserData(getState());
  clearChatSocket(chatId, fromContactId, toId);
});

export const removeConnectionThunk = createAsyncThunk("connectionRemoval", async ({ chat_id, contactId, blocked }, { getState }) => {
  const {
    data: { id },
  } = getUserData(getState());
  removeConnection(chat_id, id, contactId, blocked);
});

export const updateStatusThunk = createAsyncThunk("statusUpdate", async ({ status, type }, { getState }) => {
  const {
    data: { id },
  } = getUserData(getState());
  statusUpdate(id, { code: status, update_type: type });
});

export const acceptRequestThunk = createAsyncThunk("acceptMessageRequest", (chatId, { getState }) => {
  const {
    data: { id },
  } = getUserData(getState());

  acceptRequest(chatId, id);
  return { chatId, id };
});

export const editMessageThunk = createAsyncThunk("editMessage", async ({ chatId, messageId, update }, { getState }) => {
  const {
    data: { id },
  } = getUserData(getState());
  editMessage(chatId, messageId, update, id);
  return { id, chatId, messageId, update };
});

export const deleteMessageThunk = createAsyncThunk("deleteMessage", async ({ chatId, messageId, forAll, attachments = undefined }, { getState }) => {
  const {
    data: { id },
  } = getUserData(getState());

  deleteMessageSocket({ chatId, messageId, fromId: id, attachments }, forAll);
  return { chatId, messageId, fromId: id, forAll };
});

export const getBlockedUsersThunk = createAsyncThunk("getBlockedUsers", async (x, { getState }) => {
  const { success, data } = await ChitChatServer.get("/blocked_users");
  if (success) {
    return data;
  }
});

export const unBlockHandlerThunk = createAsyncThunk("unblockUser", async (userId, { getState }) => {
  const { success, data } = await ChitChatServer.get(`/unblock?id=${userId}`);
  if (success) {
    return data;
  }
});

const userAppDataSlice = createSlice({
  name: "user_appData",
  initialState: appDataInitialState,
  reducers: {
    updateSelectedContact: (state, action) => {
      if (!action.payload) {
        state.selectedContact.isAvailable = false;
        state.selectedContact.contactId = null;
        state.temp_contact = null;
        return;
      }
      if (action.payload !== state.temp_contact?.id) state.temp_contact = null;
      state.selectedContact.contactId = action.payload;
      state.selectedContact.isAvailable = true;
    },
    addParticipants: (state, { payload }) => {
      state.chats?.[payload.chatId]?.participants.push(payload.id);
    },
    addTypingAuthors: (state, { payload: { chat_id, authorId, isTyping } }) => {
      if (isTyping) {
        state.chats[chat_id].authors_typing.push(authorId);
      } else {
        state.chats[chat_id].authors_typing = state.chats[chat_id].authors_typing.filter((id) => id !== authorId);
      }
    },
    addInitialData: (state, { payload: { hasData, chats, connections } }) => {
      if (hasData) {
        state.contacts.hasData = hasData;
        state.contacts.data = connections;
        state.chats = chats.reduce((prevChatObj, chatObj) => ({ ...prevChatObj, [chatObj.chat_id]: chatObj }), {});
      }
      state.contacts.loading = false;
    },
    addMoreMessagesToChat: (state, action) => {
      if (state.chats[action.payload.chatId]) {
        const messages = state.chats[action.payload.chatId].messages;
        state.chats[action.payload.chatId].messages = action.payload.messages.concat(messages);
      }
    },
    clearChat: (state, { payload: { chatId, fromId } }) => {
      state.chats[chatId].messages = [];
      if (state.contacts.data[fromId]) {
        state.contacts.data[fromId].unseen_messages_count = 0;
      }
    },
    deleteContact: (state, { payload: { contactId, chatId } }) => {
      if (state.selectedContact.contactId === contactId) {
        state.temp_contact = null;
        state.selectedContact.contactId = null;
        state.selectedContact.isAvailable = false;
      }
      delete state.contacts.data[contactId];
      delete state.chats[chatId];
    },
    deleteMessage: (state, { payload: { chatId, messageId } }) => {
      const messages = state.chats[chatId].messages;
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.id === messageId) {
          messages.splice(i, 1);
          break;
        }
      }
    },
    updateMessage: (state, { payload: { chatId, messageId, update } }) => {
      const messages = state.chats[chatId].messages;
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.id === messageId) {
          message.text = update.text;
          message.edited = true;
          break;
        }
      }
    },
    updateChat: (state, { payload: update }) => {
      state.chats[update.chat_id].last_updated = update.last_updated;
      state.chats[update.chat_id].messages.push(update.message);
      state.contacts.data[update.message.sender_id].unseen_messages_count++;
    },
    updateChatSeenStatus: (state, { payload: { chat_id, fromUserId, messageId } }) => {
      const messages = state.chats[chat_id].messages;
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.id === messageId) {
          message.seenByRecipients.push(fromUserId);
          break;
        }
      }
    },
    updateSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    updateUserStatus: (state, { payload: { userId, update, self } }) => {
      if (self) {
        state.user.data.status.code = update.code;
      } else {
        state.contacts.data[userId].status = update.code;
        state.contacts.data[userId].last_active = update.lastActive;
      }
    },
    setTempConnection: (state, action) => {
      if (state.contacts.data[action.payload] === undefined) {
        state.temp_contact = state.search.data?.users?.find((user) => user.id === action.payload);
      }
      state.search.query = "";
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
    resetSocketData: (state, action) => {
      state.chats = appDataInitialState.chats;
      state.contacts = appDataInitialState.contacts;
      state.search = appDataInitialState.search;
      state.selectedContact = appDataInitialState.selectedContact;
      state.temp_contact = appDataInitialState.temp_contact;
    },
  },
  extraReducers: (builder) => {
    // Get User Profile
    builder
      .addCase(getMyProfile.pending, (state) => {
        state.user.loading = true;
        if (!state.contacts.hasData) state.contacts.loading = true;
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
      .addCase(addMessageThunk.fulfilled, (state, { payload, meta }) => {
        if (payload?.accepted) {
          state.chats?.[payload.chat_id]?.participants.push(payload.id);
        }
        if (state.chats[payload.chat_id]) {
          const messages = state.chats[payload.chat_id].messages;
          for (let i = messages.length - 1; i >= 0; i--) {
            messages[i].tempId === meta.arg.tempId && (messages[i] = payload.messageObject);
            break;
          }
        }
      })
      .addCase(addMessageThunk.rejected, (state, action) => {
        console.log("Unable to send message", action);
        let chatId = selectedContactChatId({ appData: state });
        if (chatId) {
          state.chats[chatId].messages.at(-1).error = true;
        }
      });

    builder.addCase(
      sendMessageSeenThunk.fulfilled,
      (
        state,
        {
          meta: {
            arg: { chat_id, toUserId, messageId },
          },
          payload: { id },
        }
      ) => {
        state.contacts.data[toUserId].unseen_messages_count = 0;
        const messages = state.chats[chat_id].messages;
        for (let backIndex = messages.length - 1; backIndex >= 0; backIndex--) {
          const message = messages[backIndex];
          if (message.id === messageId) {
            message.seenByRecipients.push(id);
            break;
          }
        }
      }
    );

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

    builder
      .addCase(
        clearChatThunk.fulfilled,
        (
          state,
          {
            meta: {
              arg: { chatId },
            },
          }
        ) => {
          state.chats[chatId].messages = [];
        }
      )
      .addCase(
        removeConnectionThunk.fulfilled,
        (
          state,
          {
            meta: {
              arg: { contactId, chatId },
            },
          }
        ) => {
          delete state.contacts.data[contactId];
          delete state.chats[chatId];
          if (state.selectedContact.contactId === contactId) {
            state.selectedContact.contactId = null;
            state.temp_contact = null;
            state.selectedContact.isAvailable = false;
          }
        }
      );

    builder.addCase(
      updateStatusThunk.pending,
      (
        state,
        {
          meta: {
            arg: { status, type },
          },
        }
      ) => {
        (state.user.data.status.code = status), (state.user.data.status.update_type = type);
      }
    );

    builder.addCase(acceptRequestThunk.fulfilled, (state, { payload }) => {
      state.chats?.[payload.chatId]?.participants.push(payload.id);
    });

    builder.addCase(deleteMessageThunk.fulfilled, (state, { payload: { chatId, messageId, forAll, fromId } }) => {
      if (!forAll) {
        const messages = state.chats[chatId].messages;
        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i];
          if (message.id === messageId) {
            message.deletedFor = [fromId];
            break;
          }
        }
      }
    });

    builder.addCase(editMessageThunk.fulfilled, (state, { payload }) => {
      const messages = state.chats?.[payload.chatId]?.messages;
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.id === payload.messageId) {
          message.text = payload.update.text;
          message.edited = true;
          break;
        }
      }
    });

    builder
      .addCase(getBlockedUsersThunk.fulfilled, (state, { payload }) => {
        state.user.data.blocked_users = payload.reduce((prev, curr) => ({ ...prev, [curr.id]: curr }), {});
      })
      .addCase(getBlockedUsersThunk.rejected, (state) => {
        state.user.data.blocked_users = {};
      });

    builder.addCase(unBlockHandlerThunk.fulfilled, (state, { payload }) => {
      delete state.user.data.blocked_users[payload];
    });
  },
});

export const { addParticipants, addMoreMessagesToChat, clearChat, deleteContact, updateSelectedContact, addTypingAuthors, addInitialData, deleteMessage, updateMessage, updateChat, updateChatSeenStatus, updateUserStatus, updateSearchQuery, setTempConnection, removeTempConnection, addNewConnectionRequested, resetSocketData } = userAppDataSlice.actions;

export default userAppDataSlice.reducer;
