import React, { useCallback, useEffect, useRef } from "react";
import "./message_area.sass";
import { BouncyBalls, CircularLoader, LazyLoader } from "hd-ui";
import { capitalize, dateComparer, dateDifference, getFormattedDate, getFormattedTime, msToDays } from "../../../../utils";
import { useSelector } from "react-redux";
import { contactsChat } from "../../../../library/redux/selectors";
import { THEME_VARIABLES } from "../../../../utils/enums";
import ChatInput from "./ChatInput";

const MessagesArea = ({ ContactId, endOfMessages }) => {
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

    const message = (
      <>
        {timeStampMessage}
        <div className="message message-box" data-mine={message_object.sender_id !== ContactId}>
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
