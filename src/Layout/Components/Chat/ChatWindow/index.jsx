import React, { useRef, useState } from "react";
import "./chat_window.sass";
import MessagesArea from "./MessagesArea";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedContact, getSelectedContactProfile, isChatAccepted } from "../../../../library/redux/selectors";
import { USER_STATUSES } from "../../../../utils/enums";
import { dateDifference, getFormattedDate, getFormattedTime } from "../../../../utils";
import ThreeDot from "../../Common/ThreeDot";
import { Modal } from "hd-ui";
import { acceptRequestThunk, clearChatThunk, removeConnectionThunk } from "../../../../library/redux/reducers";

const NoChatMessage = () => (
  <div className="no-chat-message-container">
    <div className="no-chat-content">
      <h2>Nothing to show here...</h2>
      <p>👈There, chit-chat starts from there</p>
    </div>
  </div>
);

const ChatHeader = ({ ContactProfile, removeContactHandler, allowOptions }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const menuButton = useRef(null);

  const renderProfileStatus = () => {
    if (!allowOptions) {
      return ContactProfile.about;
    }

    if (ContactProfile.status === USER_STATUSES.ONLINE.code) return "Online";
    let parsedDateString = "";
    const daysDifference = dateDifference(ContactProfile.last_active, new Date());
    if (daysDifference === 0) {
      parsedDateString = getFormattedTime(ContactProfile.last_active, "hh:mm");
    } else if (daysDifference === -1) {
      parsedDateString = `yesterday, ${getFormattedTime(ContactProfile.last_active, "hh:mm")}`;
    } else if (daysDifference >= -7) {
      parsedDateString = getFormattedDate(ContactProfile.last_active, "www") + ", " + getFormattedTime(ContactProfile.last_active, "hh:mm");
    } else {
      parsedDateString = getFormattedDate(ContactProfile.last_active, "dd-mmm-yy");
    }
    return `Last seen ${parsedDateString}`;
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

  const closeModal = () => setMenuOpen(false);

  const handleClearChat = () => {
    dispatch(clearChatThunk({ chatId: ContactProfile.chat_id, toId: ContactProfile.id }));
    closeModal();
  };

  const removeHandler = (block = false) => {
    removeContactHandler(block);
    closeModal();
  };
  const renderCallingOption = () => <div></div>;
  return (
    <header className="chat-area__header-container">
      <div className="chat-area__header-content">
        {renderProfileDetails()}
        <div className="contact-options">
          {allowOptions && renderCallingOption()}
          <ThreeDot title={"Chat Options"} onClick={() => setMenuOpen(true)} ref={menuButton} />
          <Modal
            open={menuOpen}
            closeHandler={() => {
              setMenuOpen(false);
            }}
            keepModalCentered={false}
            closeOnBlur={true}
            TransitionStyle="fade"
            triggerElement={menuButton}
            showBackdrop={false}
          >
            <div className="options-modal-container">
              {allowOptions && (
                <button className="option" title="Remove all messages" onClick={handleClearChat}>
                  Clear Chat
                </button>
              )}
              <button className="option red" title="Delete the connection" onClick={() => removeHandler()}>
                Delete Connection
              </button>
              <button className="option red" title="Delete and Block connection" onClick={() => removeHandler(true)}>
                Delete and Block
              </button>
            </div>
          </Modal>
        </div>
      </div>
    </header>
  );
};

const ChatWindow = () => {
  const selectedContact = useSelector(getSelectedContact);
  const ContactProfile = useSelector(getSelectedContactProfile);
  const chatAccepted = useSelector(isChatAccepted);
  const dispatch = useDispatch();

  const deleteChat = (block = false) => {
    dispatch(
      removeConnectionThunk({
        chat_id: ContactProfile.chat_id,
        contactId: ContactProfile.id,
        blocked: block,
      })
    );
  };

  const acceptChat = () => {
    dispatch(acceptRequestThunk(ContactProfile.chat_id));
  };
  // TODO: Need to add a skeleton loading for data that is not available but required
  return (
    <div className="chat-window-main-container">
      {selectedContact?.isAvailable ? (
        <div className="chat-area">
          <ChatHeader ContactProfile={ContactProfile} removeContactHandler={deleteChat} allowOptions={chatAccepted.byUser && chatAccepted.byConnection} />
          <MessagesArea
            ContactId={selectedContact.contactId}
            endOfMessages={selectedContact.fetchedAllMessages}
            RequestPopup={
              <>
                {!chatAccepted.byUser && (
                  <div className="chat-area__permission-popup">
                    <div className="permission-popup-container">
                      <p>You have a new message request from {ContactProfile.firstName}. Would you like to:</p>
                      <div className="permission-actions">
                        <button className="action accept" onClick={acceptChat}>
                          Accept
                        </button>
                        <button className="action" onClick={() => deleteChat()}>
                          Reject
                        </button>
                        <button className="action" onClick={() => deleteChat(true)}>
                          Reject & Block
                        </button>
                      </div>
                      <sub>*By sending a message, you are also implicitly agreeing to the request.</sub>
                    </div>
                  </div>
                )}
                {ContactProfile.restricted && (
                  <div className="chat-area__permission-popup">
                    <p style={{ textAlign: "center", margin: "0", color: "var(--error-color)" }}>You can no longer send message to this recipient</p>
                  </div>
                )}
              </>
            }
          />
        </div>
      ) : (
        <NoChatMessage />
      )}
    </div>
  );
};

export default ChatWindow;
