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

const getSelectedContactProfile = createSelector(
  getSelectedContact,
  (state) => state,
  (selectedContact, state) => state.appData.contacts.data[selectedContact.contactId]
);
const chatInfoForContactTile = (contact_id) => {
  return createSelector(
    getSelectedContact,
    (state) => state,
    (selectedContact, state) => {
      const contacts = state.appData.contacts.data;
      const contactsChat = state.appData.chats[contacts[contact_id].chat_id];

      const contacts_messages = contactsChat.messages;

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
  ({ chat_id }, state) => state.appData.chats[chat_id]
);

const searchState = (state) => state.appData.search;

//---------------------App configuration selector

const getClockHour = (state) => state.config.clockHr;

export {
  // UserState
  getUserData,

  // UserAppData
  getContactsListSorted,
  getSelectedContact,
  getSelectedContactProfile,
  contactsChat,
  chatInfoForContactTile,
  searchState,

  //AppConfig
  getClockHour,
};
