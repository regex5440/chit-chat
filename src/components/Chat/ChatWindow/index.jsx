import React, { useContext, useEffect, useRef, useState } from "react";
import "./chat_window.sass";
import MessagesArea from "./MessagesArea";
import { useDispatch, useSelector } from "react-redux";
import { getCallStatus, getCallUIDetails, getDeviceDetails, getSelectedContact, getSelectedContactProfile, getUserStreamControl, isChatAccepted } from "../../../library/redux/selectors";
import { USER_STATUSES } from "../../../utils/enums";
import { dateDifference, getFormattedDate, getFormattedTime, getImageUrl } from "../../../utils";
import ThreeDot from "../../Common/ThreeDot";
import { acceptRequestThunk, clearChatThunk, enableAudio, enableVideo, minimizeComponent, removeConnectionThunk, showCallerComponent, updateSelectedContact } from "../../../library/redux/reducers";
import { LeftArrow as BackIcon, MicrophoneIcon, TelephoneIcon, VideoIcon } from "../../../assets/icons";
import * as Popover from "@radix-ui/react-popover";
import { MainWindow } from "../../../context/layoutFunctions";

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
  const device = useSelector(getDeviceDetails);
  const scrollTo = useContext(MainWindow);
  const header = useRef(null);
  const callUIDetails = useSelector(getCallUIDetails);
  const mediaController = useSelector(getUserStreamControl);
  const callStatus = useSelector(getCallStatus);
  useEffect(() => {
    if (ContactProfile) {
      scrollTo("end");
    }
    return () => {
      scrollTo("start");
    };
  }, [ContactProfile]);

  const renderProfileStatus = () => {
    if (ContactProfile.status === USER_STATUSES.ONLINE.code) return "Online";
    if (!allowOptions || !ContactProfile.last_active) {
      return ContactProfile.about || "";
    }
    let parsedDateString = "";
    const daysDifference = dateDifference(ContactProfile.last_active, new Date());
    if (daysDifference === 0) {
      parsedDateString = `today, ${getFormattedTime(ContactProfile.last_active, "hh:mm")}`;
    } else if (daysDifference === -1) {
      parsedDateString = `yesterday, ${getFormattedTime(ContactProfile.last_active, "hh:mm")}`;
    } else if (daysDifference >= -7) {
      parsedDateString = getFormattedDate(ContactProfile.last_active, "www") + ", " + getFormattedTime(ContactProfile.last_active, "hh:mm");
    } else {
      parsedDateString = getFormattedDate(ContactProfile.last_active, "dd-mmm-yy");
    }
    return `Last seen ${parsedDateString}`;
  };

  const moveToMainWindow = () => {
    dispatch(updateSelectedContact());
  };

  const renderProfileDetails = () => {
    return (
      <div className="profile-overview-container">
        {device.type === "mobile" && <BackIcon width="25px" style={{ marginRight: "5px" }} stroke={"var(--icon-stroke)"} fill={"var(--icon-stroke)"} onClick={moveToMainWindow} />}
        <div className="profile-picture-container">
          <img src={getImageUrl(ContactProfile.avatar)} alt={ContactProfile.firstName} className="profile-picture" data-dull={ContactProfile.deleted} />
        </div>
        <div className="profile-details">
          <div className="profile-name" data-no_data={ContactProfile.deleted}>{`${ContactProfile.firstName} ${ContactProfile.lastName}`}</div>
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

  const initiateCall = (e) => {
    const callType = e.currentTarget.dataset.type;
    dispatch(showCallerComponent({ byUser: true, callType, contactId: ContactProfile.id, chatId: ContactProfile.chat_id }));
  };
  const renderCallingOption = () => (
    <>
      <button className="call-option" onClick={initiateCall} data-type="video" title="Video Call">
        <VideoIcon height="30px" width="30px" />
      </button>
      <button className="call-option" onClick={initiateCall} data-type="audio" title="Voice Call">
        <TelephoneIcon height="30px" width="30px" />
      </button>
    </>
  );
  return (
    <header className="chat-area__header-container">
      <div className="chat-area__header-content">
        {renderProfileDetails()}
        <div className="contact-options">
          {allowOptions && !ContactProfile.deleted && renderCallingOption()}
          <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <ThreeDot title={"Chat Options"} />
            </Popover.Trigger>
            <Popover.Content asChild>
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
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>
      {callUIDetails.isMinimized && (
        <div className="chat-area__caller-header" onClick={() => dispatch(minimizeComponent(false))}>
          <div className="call-details">
            <span style={{ textTransform: "capitalize" }}>{callStatus}</span>
          </div>
          <div className="call-controls" onClick={(e) => e.stopPropagation()}>
            <div className="option">
              <input type="checkbox" id="call-header-camera" hidden checked={mediaController.videoEnabled} onChange={(e) => dispatch(enableVideo(e.target.checked))} />
              <label htmlFor="call-header-camera">
                <VideoIcon height={16} width={16} />
              </label>
            </div>
            <div className="option">
              <input type="checkbox" id="call-header-voice" hidden checked={mediaController.audioEnabled} onChange={(e) => dispatch(enableAudio(e.target.checked))} />
              <label htmlFor="call-header-voice">
                <MicrophoneIcon height={16} width={16} />
              </label>
            </div>
          </div>
        </div>
      )}
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
