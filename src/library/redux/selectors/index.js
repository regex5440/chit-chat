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
      return contact.firstName.includes(searchQuery) || contact.lastName.includes(searchQuery) || contact.username.includes(searchQuery);
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
const chatInfoForContactTile = (contact_id) => {
  return createSelector(
    getSelectedContact,
    (state) => state,
    (selectedContact, state) => {
      const userId = state.appData.user.data.id;
      const contacts = state.appData.contacts.data;
      const chatId = contacts[contact_id]?.chat_id;
      const contactsChat = state.appData.chats[chatId];

      const contacts_messages = contactsChat?.messages;

      return {
        last_message: contacts_messages.length > 0 ? getLastViewableMessage(contacts_messages, userId) : null,
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

//---------------------App configuration selector

const getClockHour = (state) => state.config.clockHr;
const getDeviceDetails = (state) => state.config.deviceDetails;

export {
  // UserState
  getUserData,

  // UserAppData
  getContactsRaw,
  getContactsListSorted,
  getSelectedContact,
  getSelectedContactProfile,
  selectedContactChatId,
  getTempConnection,
  isChatAccepted,
  unseenMsgCountSelectedContact,
  contactsChat,
  chatInfoForContactTile,
  searchState,

  //AppConfig
  getClockHour,
  getDeviceDetails,
};
