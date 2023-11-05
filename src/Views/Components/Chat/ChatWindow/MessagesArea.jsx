import React, { useCallback, useEffect, useRef, useState } from "react";
import "./message_area.sass";
import { BouncyBalls, CircularLoader, DropDown, LazyLoader, Modal } from "hd-ui";
import { capitalize, copyToClipboard, dateComparer, dateDifference, getFormattedDate, getFormattedTime, msToDays } from "../../../../utils";
import { useDispatch, useSelector } from "react-redux";
import { contactsChat, getUserData, unseenMsgCountSelectedContact } from "../../../../library/redux/selectors";
import ChatInput from "./ChatInput";
import { DoubleTickIcon, ExclamationIcon, SentIcon } from "../../../../assets/icons";
import { sendMessageSeenThunk } from "../../../../library/redux/reducers";
import { ClockIcon, CopyIcon, Cross2Icon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import * as DropDownMenu from "@radix-ui/react-dropdown-menu";
import { deleteMessageThunk, editMessageThunk } from "../../../../library/redux/reducers/user_appData";

const Message = ({ messageObject, ContactId, ChatId, deleteMessage, editMessage }) => {
  const dispatch = useDispatch();
  const messageContainer = useRef(null);
  const unseenMessagesCount = useSelector(unseenMsgCountSelectedContact);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const isMine = messageObject.sender_id !== ContactId;
  useEffect(() => {
    document.onkeydown = (e) => {
      if (e.key === "Escape") {
        setOptionsOpen(false);
      }
    };
  }, []);
  useEffect(() => {
    if (!isMine && messageContainer.current && unseenMessagesCount > 0) {
      //* chat.last_updated is just to update the observer to latest message
      const observer = new IntersectionObserver(([entries]) => {
        if (entries.isIntersecting) {
          dispatch(sendMessageSeenThunk({ chat_id: ChatId, toUserId: ContactId, messageId: messageObject.id }));
          observer.disconnect();
        }
      });
      observer.observe(messageContainer.current);
    }
  }, [messageContainer.current, unseenMessagesCount, isMine]);

  let messageStatus = "";
  if (messageObject.seenByRecipients?.includes(ContactId)) {
    messageStatus = <DoubleTickIcon height="20px" width="20px" fill="#2E9DFB" />;
  } else if (!messageObject.id) {
    messageStatus = <ClockIcon height="16px" width="16px" fill="var(--icon-stroke)" />;
  } else if (messageObject.error) {
    messageStatus = <ExclamationIcon height="16px" width="18px" />;
  } else {
    messageStatus = <SentIcon height="18px" width="18px" fill="var(--icon-stroke)" />;
  }
  const copyHandler = () => {
    copyToClipboard(messageObject.text);
  };
  return (
    <>
      <DropDownMenu.Root open={optionsOpen} onOpenChange={setOptionsOpen}>
        <DropDownMenu.Trigger asChild>
          <div
            className="message message-box"
            data-mine={isMine}
            ref={messageContainer}
            onContextMenu={(e) => {
              e.preventDefault();
              setOptionsOpen(true);
            }}
            data-emojionly={messageObject.type === "text" && messageObject.text.match(/^[\p{Emoji}\s]+$/u)?.[0].match(/[^0-9]+/g)?.[0] ? true : false}
          >
            {isMine && <span className="message-status">{messageStatus}</span>}
            <span className="message-text">{messageObject.text}</span>
            <span className="message-time">
              {messageObject.edited && <em>Edited</em>}
              {getFormattedTime(messageObject.timestamp, "h:mm")}
            </span>
          </div>
        </DropDownMenu.Trigger>
        <DropDownMenu.Portal>
          <DropDownMenu.Content className="message-options-menu">
            {/* <DropDownMenu.Arrow /> */}
            {messageObject.type === "text" && (
              <DropDownMenu.Item className="option" onClick={copyHandler}>
                <CopyIcon />
                <div>Copy</div>
              </DropDownMenu.Item>
            )}
            {messageObject.type === "text" && isMine && (
              <DropDownMenu.Item className="option" onClick={() => editMessage(messageObject)}>
                <Pencil2Icon />
                <div>Edit</div>
              </DropDownMenu.Item>
            )}
            <DropDownMenu.Item className="option" onClick={() => deleteMessage({ id: messageObject.id, isMine })}>
              <TrashIcon />
              <div>Delete</div>
            </DropDownMenu.Item>
          </DropDownMenu.Content>
        </DropDownMenu.Portal>
      </DropDownMenu.Root>
    </>
  );
};

const MessagesArea = ({ ContactId, endOfMessages, RequestPopup }) => {
  const messageContainer = useRef(null);
  const { data: user } = useSelector(getUserData);
  const lastMessageDateDifference = useRef(null);
  const chat = useSelector(contactsChat);
  const [oldMessage, setOldMessage] = useState(null);
  const [deleteAlertData, setDeleteAlertData] = useState(null);
  const dispatch = useDispatch();
  const scrollToBottom = useCallback(() => {
    if (messageContainer.current) {
      messageContainer.current.scrollTo(0, messageContainer.current.scrollHeight);
    }
  }, []);
  const contactIsTyping = chat?.authors_typing?.includes(ContactId);

  const deleteHandler = (forAll = false) => {
    dispatch(deleteMessageThunk({ chatId: chat.chat_id, messageId: deleteAlertData.id, forAll }));
    setDeleteAlertData(null);
  };

  const editHandler = (newText) => {
    if (newText !== oldMessage.text) {
      dispatch(editMessageThunk({ chatId: chat.chat_id, messageId: oldMessage.id, update: { text: newText } }));
    }
    setOldMessage(null);
  };
  useEffect(() => {
    document.onkeydown = (e) => {
      if (e.key === "Escape") {
        setOldMessage(null);
        setDeleteAlertData(null);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [contactIsTyping, chat?.messages?.length || false]);

  useEffect(() => {
    scrollToBottom();
    if (contactIsTyping) scrollToBottom();
    // TODO: Have a look in use case of scrolling down
    setOldMessage(null);
    setDeleteAlertData(null);
    lastMessageDateDifference.current = null;
  }, [ContactId]);

  const renderMessage = (message) => {
    if (message.deletedFor?.includes(user.id)) return null;
    let timeStampMessage = "";
    let TimeStamp = "";
    const daysDifference = dateDifference(new Date(), message.timestamp);
    if (daysDifference !== lastMessageDateDifference.current) {
      if (daysDifference > 7) {
        // Show Time Stamp
        TimeStamp = getFormattedDate(message.timestamp, "www, dd-mmm-yy");
      } else if (daysDifference > 1 && daysDifference <= 7) {
        //Show Weekdays
        TimeStamp = getFormattedDate(message.timestamp, "wwww");
      } else {
        //Show relative time: Today, Yesterday
        TimeStamp = capitalize(dateComparer.format(-1 * daysDifference, "day"));
      }
      timeStampMessage = <div className="message-stamp">{TimeStamp}</div>;
    }
    lastMessageDateDifference.current = daysDifference;
    return (
      <>
        {timeStampMessage}
        <Message
          messageObject={message}
          ContactId={ContactId}
          ChatId={chat.chat_id}
          editMessage={(...args) => {
            setOldMessage(...args);
            setDeleteAlertData(null);
          }}
          deleteMessage={(...args) => {
            setDeleteAlertData(...args);
            setOldMessage(null);
          }}
        />
      </>
    );
  };

  return (
    <>
      <div className="message-area">
        <div className="messages-container" ref={messageContainer}>
          <LazyLoader
            endOfData={endOfMessages}
            onVisibleHandler={() => console.log("Hi")}
            Loader={
              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <CircularLoader size={30} riderColor={"var(--icon-stroke)"} />
              </div>
            }
          />
          {chat?.messages && chat.messages.map((message, index) => renderMessage(message))}
          {contactIsTyping && (
            <div className="message message-loading">
              <BouncyBalls containerColor="transparent" />
            </div>
          )}
          {RequestPopup}
        </div>
        {deleteAlertData && (
          <div className="message-area__alert">
            <div className="message-area__alert__container">
              <div className="alert-title">Delete Message</div>
              <div className="alert-description">Are you sure you want to delete this message?</div>
              <div className="alert-actions-container" data-options={deleteAlertData?.isMine ? "three" : "two"}>
                <div className="action btn" onClick={() => deleteHandler(false)}>
                  Delete for me
                </div>
                {deleteAlertData.isMine && (
                  <div className="action btn" onClick={() => deleteHandler(true)}>
                    Delete for everyone
                  </div>
                )}
                <div
                  className="cancel btn"
                  onClick={() => {
                    setDeleteAlertData(null);
                  }}
                >
                  Cancel
                </div>
              </div>
            </div>
          </div>
        )}
        {oldMessage && (
          <div className="message-area__edit">
            <div className="message-area__edit__container">
              <div className="title">
                <Pencil2Icon />
                <span>Editing Message</span>
                <Cross2Icon className="close" width={20} height={20} onClick={() => setOldMessage(null)} />
              </div>
              <div className="message-description">{oldMessage?.text}</div>
            </div>
          </div>
        )}
      </div>
      <ChatInput scrollToBottom={scrollToBottom} editableMessage={oldMessage} editHandler={editHandler} />
    </>
  );
};

export default MessagesArea;
