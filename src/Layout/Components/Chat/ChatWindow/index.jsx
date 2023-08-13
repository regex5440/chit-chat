import React, { useRef, useState } from "react";
import ChatInput from "./ChatInput";
import "./chat_window.sass";
import MessagesArea from "./MessagesArea";
import { useSelector } from "react-redux";
import { getSelectedContact, getSelectedContactProfile } from "../../../../library/redux/selectors";
import { USER_STATUSES } from "../../../../utils/enums";
import { getFormattedTime } from "../../../../utils";

const NoChatMessage = () => (
  <div className="no-chat-message-container">
    <div className="no-chat-content">
      <h2>Nothing to show here...</h2>
      <p>👈There, chit-chat starts from there</p>
    </div>
  </div>
);

const ChatHeader = () => {
  const ContactProfile = useSelector(getSelectedContactProfile);
  const renderProfileStatus = () => {
    // if (authors_typing.includes(ContactProfile.id)) return "Typing...";
    // else
    if (ContactProfile.status === USER_STATUSES.ONLINE.code) return "Online";
    else {
      let lastActiveParsed = getFormattedTime(Date.parse(ContactProfile.last_active), `hh:mm`);
      return `Last seen at ${lastActiveParsed}`;
    }
  };

  const renderProfileDetails = () => {
    return (
      <div className="profile-container">
        <div className="profile-picture-container">
          <img src={ContactProfile.avatar.url || (ContactProfile.avatar.key ? `${import.meta.env.CC_IMAGE_BUCKET_URL}/${ContactProfile.avatar.key}` : "")} alt={ContactProfile.firstName} className="profile-picture" />
        </div>
        <div className="profile-details">
          <div className="profile-name">{`${ContactProfile.firstName} ${ContactProfile.lastName}`}</div>
          <div className="profile-status">{renderProfileStatus()}</div>
        </div>
      </div>
    );
  };

  return (
    <header className="chat-area__header-container">
      <div className="chat-area__header-content">
        {renderProfileDetails()}
        <div className="contact-options"></div>
      </div>
    </header>
  );
};

const ChatWindow = () => {
  const selectedContact = useSelector(getSelectedContact);

  // @Requirement
  // Need to add a skeleton loading for data that is not available but required
  return (
    <div className="chat-window-main-container">
      {selectedContact?.isAvailable ? (
        <div className="chat-area">
          <ChatHeader />
          <MessagesArea ContactId={selectedContact.contactId} endOfMessages={selectedContact.fetchedAllMessages} />
        </div>
      ) : (
        <NoChatMessage />
      )}
    </div>
  );
};

export default ChatWindow;
