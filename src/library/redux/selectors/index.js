import { createSelector } from "@reduxjs/toolkit";

//-------------User State Selectors
const getUserData = (state) => state.appData.user;

//---------------- User AppData Selectors
const getContactsListSorted = (state) => {
  const contacts = state.appData.contacts;
  const chats = state.appData.chats;

  if (contacts.loading) return contacts;

  const searchQuery = state.appData.search.query;
  if (searchQuery) {
    const filteredConnections = Object.values(contacts.data).filter((contact) => {
      return !contact.deleted && (contact.firstName.toLowerCase().includes(searchQuery) || contact.lastName.toLowerCase().includes(searchQuery) || contact.username.toLowerCase().includes(searchQuery));
    });
    return {
      searchResults: true,
      hasData: filteredConnections.length > 0,
      data: filteredConnections,
    };
  }
  const data = Object.values(contacts.data).sort((A, B) => {
    let DateA = Date.parse(chats[A.chat_id].last_updated);
    let DateB = Date.parse(chats[B.chat_id].last_updated);
    return DateB > DateA ? 1 : -1;
  });
  return {
    hasData: data.length > 0,
    data,
  };
};
const getContactsRaw = (state) => state.appData.contacts;
const getSelectedContact = (state) => state.appData.selectedContact;

const getTempConnection = (state) => state.appData.temp_contact;

const getSelectedContactProfile = createSelector(
  getSelectedContact,
  (state) => state,
  (selectedContact, state) => state.appData.contacts.data[selectedContact.contactId] || state.appData.temp_contact
);
const getLastViewableMessage = (messages, userId, index = -1) => {
  if (!messages.at(index)?.deletedFor?.includes(userId)) {
    return messages.at(index);
  }
  return getLastViewableMessage(messages, userId, index - 1);
};
const getContactProfile = (userId) => (state) => state.appData.contacts?.data[userId] || null;
const getChatData = (chatId) => (state) => state.appData.chats[chatId] || null;
const chatInfoForContactTile = (contact_id) => {
  return createSelector(
    getSelectedContact,
    (state) => state,
    (selectedContact, state) => {
      const userId = state.appData.user.data.id;
      const contact = getContactProfile(contact_id)(state);
      const chatId = contact?.chat_id;
      const contactsChat = getChatData(chatId)(state);

      const contacts_messages = contactsChat?.messages;

      return {
        last_message: contacts_messages?.length > 0 ? getLastViewableMessage(contacts_messages, userId) : null,
        last_updated: contactsChat?.last_updated,
        authors_typing: contactsChat?.authors_typing,
        isSelected: selectedContact?.contactId === contact_id,
      };
    }
  );
};
const contactsChat = createSelector(
  getSelectedContactProfile,
  (state) => state,
  (contactProfile, state) => {
    if (!state.appData.temp_contact) {
      return state.appData.chats[contactProfile?.chat_id];
    }
    return {};
  }
);

const selectedContactChatId = createSelector(getSelectedContactProfile, (selectedContactProfile) => {
  return selectedContactProfile.chat_id;
});

const isChatAccepted = createSelector(getSelectedContact, getTempConnection, contactsChat, getUserData, (selectedContact, tempConnection, chat, { data: user }) => {
  return {
    byUser: chat?.participants?.includes(user.id) || tempConnection?.id ? true : false,
    byConnection: chat?.participants?.includes(selectedContact.contactId),
  };
});

const searchState = (state) => state.appData.search;

const unseenMsgCountSelectedContact = createSelector(
  getSelectedContact,
  (state) => state,
  (selectedContact, state) => {
    return state.appData.contacts.data?.[selectedContact.contactId]?.unseen_messages_count;
  }
);

const getBlockedUsers = (state) => state.appData.user.data.blocked_users;

//---------------------App configuration selector

const getClockHour = (state) => state.config.clockHr;
const getDeviceDetails = (state) => state.config.deviceDetails;
const getTheme = (state) => state.config.theme;
const getSelectedFiles = (state) => state.config.selectedFiles;
const getAttachmentMetadata = (state) => state.config.modifications.no_metadata;

// Call selectors
const getCallUIDetails = (state) => state.call.callUI;
const getPeerData = (state) => state.call.peer_data;
const getUserStreamControl = (state) => state.call.controls;
const getCallStatus = (state) => state.call.callStatus.state;
const getConnectedUser = (state) => state.call.connectedUser;
const getConnectedUserProfile = createSelector(
  getConnectedUser,
  (state) => state,
  (connectedUser, state) => {
    return getContactProfile(connectedUser.userId)(state);
  }
);

export {
  // UserState
  getUserData,

  // UserAppData
  getContactsRaw,
  getContactsListSorted,
  getContactProfile,
  getSelectedContact,
  getSelectedContactProfile,
  selectedContactChatId,
  getTempConnection,
  getChatData,
  getBlockedUsers,
  isChatAccepted,
  unseenMsgCountSelectedContact,
  contactsChat,
  chatInfoForContactTile,
  searchState,

  //AppConfig
  getClockHour,
  getDeviceDetails,
  getTheme,
  getSelectedFiles,
  getAttachmentMetadata,
  getCallUIDetails,
  getPeerData,
  getUserStreamControl,
  getCallStatus,
  getConnectedUser,
  getConnectedUserProfile,
};
