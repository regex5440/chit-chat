import React, { useCallback, useEffect, useRef } from "react";
import "./message_area.sass";
import { BouncyBalls, CircularLoader, LazyLoader } from "hd-ui";
import { capitalize, dateComparer, dateDifference, getFormattedDate, getFormattedTime, msToDays } from "../../../../utils";
import { useDispatch, useSelector } from "react-redux";
import { contactsChat, getUnreadMessagesCount } from "../../../../library/redux/selectors";
import { THEME_VARIABLES } from "../../../../utils/enums";
import ChatInput from "./ChatInput";
import { DoubleTickIcon, ExclamationIcon, SentIcon } from "../../../../assets/icons";
import { sendMessageSeenUpdate } from "../../../../library/socket.io/socket";
import { sendMessageSeenThunk } from "../../../../library/redux/reducers";

const MessagesArea = ({ ContactId, endOfMessages }) => {
  const messageContainer = useRef(null);
  const lastMessageDateDifference = useRef(null);
  const chat = useSelector(contactsChat);
  const dispatch = useDispatch();
  const unseenMessagesCount = useSelector(getUnreadMessagesCount);
  const scrollToBottom = useCallback(() => {
    if (messageContainer.current) {
      messageContainer.current.scrollTo(0, messageContainer.current.scrollHeight);
    }
  }, []);
  const contactIsTyping = chat?.authors_typing?.includes(ContactId);

  useEffect(() => {
    if (messageContainer.current && chat?.last_updated) {
      //* chat.last_updated is just to update the observer to latest message
      if (unseenMessagesCount > 0) {
        const lastMessageElement = messageContainer.current.lastElementChild;
        if (lastMessageElement.dataset.mine === "true") return;
        const observer = new IntersectionObserver(([entries]) => {
          if (entries.isIntersecting) {
            dispatch(sendMessageSeenThunk({ chat_id: chat.chat_id, toUserId: ContactId }));
            observer.disconnect();
          }
        });
        observer.observe(lastMessageElement);
      }
    }
  }, [messageContainer.current, chat?.last_updated]);

  useEffect(() => {
    scrollToBottom();
  }, [contactIsTyping, chat?.messages?.length || false]);

  useEffect(() => {
    scrollToBottom();
    if (contactIsTyping) scrollToBottom();
    // TODO: Have a look in use case of scrolling down

    lastMessageDateDifference.current = null;
  }, [ContactId]);

  const renderMessage = (message_object) => {
    let timeStampMessage = "";
    let TimeStamp = "";
    const daysDifference = dateDifference(new Date(), message_object.timestamp);
    if (daysDifference !== lastMessageDateDifference.current) {
      if (daysDifference > 7) {
        // Show Time Stamp
        TimeStamp = getFormattedDate(message_object.timestamp, "www, dd-mmm-yy");
      } else if (daysDifference > 1 && daysDifference <= 7) {
        //Show Weekdays
        TimeStamp = getFormattedDate(message_object.timestamp, "wwww");
      } else {
        //Show relative time: Today, Yesterday
        TimeStamp = capitalize(dateComparer.format(-1 * daysDifference, "day"));
      }
      timeStampMessage = <div className="message-stamp">{TimeStamp}</div>;
    }
    lastMessageDateDifference.current = daysDifference;
    const isMine = message_object.sender_id !== ContactId;
    const message = (
      <>
        {timeStampMessage}
        <div className="message message-box" data-mine={isMine}>
          {isMine && <span className="message-status">{message_object.unseen ? <SentIcon height="18px" width="18px" /> : message_object.error ? <ExclamationIcon height="18px" width="18px" /> : <DoubleTickIcon height="20px" width="20px" fill="#2E9DFB" />}</span>}
          <span className="message-text">{message_object.text}</span>
          <span className="message-time">{getFormattedTime(message_object.timestamp, "h:mm")}</span>
        </div>
      </>
    );
    return message;
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
                <CircularLoader width={30} loaderColor={THEME_VARIABLES.loaderColor} />
              </div>
            }
          />
          {chat?.messages && chat.messages.map((message) => renderMessage(message))}
          {contactIsTyping && (
            <div className="message message-loading">
              <BouncyBalls containerColor="transparent" />
            </div>
          )}
        </div>
      </div>
      <ChatInput scrollToBottom={scrollToBottom} />
    </>
  );
};

export default MessagesArea;
