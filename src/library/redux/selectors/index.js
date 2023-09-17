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

  return {
    hasData: contacts.hasData,
    data: Object.values(contacts.data).sort((A, B) => {
      let DateA = Date.parse(chats[A.chat_id].last_updated);
      let DateB = Date.parse(chats[B.chat_id].last_updated);
      return DateB > DateA ? 1 : -1;
    }),
  };
};
const getContactsRaw = (state) => state.appData.contacts.data;
const getSelectedContact = (state) => state.appData.selectedContact;

const getTempConnection = (state) => state.appData.temp_contact;

const getSelectedContactProfile = createSelector(
  getSelectedContact,
  (state) => state,
  (selectedContact, state) => state.appData.contacts.data[selectedContact.contactId] || state.appData.temp_contact
);
const chatInfoForContactTile = (contact_id) => {
  return createSelector(
    getSelectedContact,
    (state) => state,
    (selectedContact, state) => {
      const contacts = state.appData.contacts.data;
      const contactsChat = state.appData.chats[contacts[contact_id].chat_id];

      const contacts_messages = contactsChat?.messages;

      return {
        last_message: contacts_messages[contacts_messages.length - 1],
        last_updated: contactsChat.last_updated,
        authors_typing: contactsChat.authors_typing,
        isSelected: selectedContact.contactId === contact_id,
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

export {
  // UserState
  getUserData,

  // UserAppData
  getContactsListSorted,
  getSelectedContact,
  getSelectedContactProfile,
  selectedContactChatId,
  getTempConnection,
  unseenMsgCountSelectedContact,
  contactsChat,
  chatInfoForContactTile,
  searchState,

  //AppConfig
  getClockHour,
};
