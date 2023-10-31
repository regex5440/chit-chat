import React, { useCallback, useEffect, useRef } from "react";
import "./message_area.sass";
import { BouncyBalls, CircularLoader, LazyLoader } from "hd-ui";
import { capitalize, dateComparer, dateDifference, getFormattedDate, getFormattedTime, msToDays } from "../../../../utils";
import { useDispatch, useSelector } from "react-redux";
import { contactsChat, unseenMsgCountSelectedContact } from "../../../../library/redux/selectors";
import ChatInput from "./ChatInput";
import { DoubleTickIcon, ExclamationIcon, SentIcon } from "../../../../assets/icons";
import { sendMessageSeenThunk } from "../../../../library/redux/reducers";
import { ClockIcon } from "@radix-ui/react-icons";

const Message = ({ messageObject, ContactId, ChatId }) => {
  const dispatch = useDispatch();
  const messageContainer = useRef(null);
  const unseenMessagesCount = useSelector(unseenMsgCountSelectedContact);

  useEffect(() => {
    if (messageContainer.current && unseenMessagesCount > 0) {
      //* chat.last_updated is just to update the observer to latest message
      if (messageContainer.current.dataset.mine === "true") return;
      const observer = new IntersectionObserver(([entries]) => {
        if (entries.isIntersecting) {
          dispatch(sendMessageSeenThunk({ chat_id: ChatId, toUserId: ContactId, messageId: messageObject.id }));
          observer.disconnect();
        }
      });
      observer.observe(messageContainer.current);
    }
  }, [messageContainer.current, unseenMessagesCount]);

  const isMine = messageObject.sender_id !== ContactId;
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

  return (
    <div className="message message-box" data-mine={isMine} ref={!isMine ? messageContainer : null}>
      {isMine && <span className="message-status">{messageStatus}</span>}
      <span className="message-text">{messageObject.text}</span>
      <span className="message-time">{getFormattedTime(messageObject.timestamp, "h:mm")}</span>
    </div>
  );
};

const MessagesArea = ({ ContactId, endOfMessages, RequestPopup }) => {
  const messageContainer = useRef(null);
  const lastMessageDateDifference = useRef(null);
  const chat = useSelector(contactsChat);

  const scrollToBottom = useCallback(() => {
    if (messageContainer.current) {
      messageContainer.current.scrollTo(0, messageContainer.current.scrollHeight);
    }
  }, []);
  const contactIsTyping = chat?.authors_typing?.includes(ContactId);

  useEffect(() => {
    scrollToBottom();
  }, [contactIsTyping, chat?.messages?.length || false]);

  useEffect(() => {
    scrollToBottom();
    if (contactIsTyping) scrollToBottom();
    // TODO: Have a look in use case of scrolling down

    lastMessageDateDifference.current = null;
  }, [ContactId]);

  const renderMessage = (message) => {
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
        <Message messageObject={message} ContactId={ContactId} ChatId={chat.chat_id} />
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
      </div>
      <ChatInput scrollToBottom={scrollToBottom} />
    </>
  );
};

export default MessagesArea;
