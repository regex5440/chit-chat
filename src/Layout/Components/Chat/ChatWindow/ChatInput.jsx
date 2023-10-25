import React, { useEffect, useRef, useState } from "react";
import { MicrophoneIcon, PaperClipIcon, SendIcon, SmileyEmoji } from "../../../../assets/icons";
import { useDebounce } from "../../../../utils";
import "./chat_input.sass";
import { useDispatch, useSelector } from "react-redux";
import { addMessageThunk, updateTypingThunk } from "../../../../library/redux/reducers";
import { getDeviceDetails, getTempConnection } from "../../../../library/redux/selectors";

const ChatInput = ({ scrollToBottom }) => {
  const [messageText, setInput] = useState("");
  const dispatch = useDispatch();
  const typingStarted = useRef(false);
  const textArea = useRef(null);
  const tempContact = useSelector(getTempConnection);
  const deviceDetails = useSelector(getDeviceDetails);
  const debouncedInput = useDebounce(() => {
    typingStarted.current = false;
    dispatch(updateTypingThunk(false));
  }, 1000);

  const inputHandler = (e) => {
    setInput(e.target.value);
    if (!typingStarted.current) {
      typingStarted.current = true;
      dispatch(updateTypingThunk(true));
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    let message = messageText;
    if (message) {
      // 1 Send the message
      dispatch(
        addMessageThunk({
          text: message,
          timestamp: new Date().toISOString(),
          type: "text",
        })
      );
      // scroll to the bottom
      scrollToBottom();
      // 3 Empty the input
      setInput("");
    }
  };
  useEffect(() => {
    if (deviceDetails.type === "mobile") {
      setTimeout(() => {
        textArea.current?.focus();
      }, 500);
    } else {
      textArea.current?.focus();
    }
  }, []);

  return (
    <div className="user-chat-option" data-unselectable={tempContact?.restricted ? true : false}>
      <div className="user-chat-option__container option">
        <div className="option__emoji click-icon not-allowed" title="Emoticons">
          <SmileyEmoji height="24" width="24" />
        </div>
        <div className="option__attachments click-icon not-allowed" title="Attachments">
          <PaperClipIcon height="24" width="24" />
        </div>
        <form className="option__input" onSubmit={submitHandler}>
          {deviceDetails.type === "mobile" ? <textarea placeholder="Type a message or send a voice note" onChange={debouncedInput} onInput={inputHandler} value={messageText} ref={textArea} /> : <input type="text" placeholder="Type a message or send a voice note" onChange={debouncedInput} onInput={inputHandler} value={messageText} ref={textArea} />}
        </form>
        {messageText ? (
          <div className="option__send-text click-icon" title="Send" onClick={submitHandler}>
            <SendIcon height="24" width="24" fill="var(--icon-stroke)" />
          </div>
        ) : (
          <div className="option__voice-note click-icon not-allowed" title="Voice Message">
            <MicrophoneIcon height="24" width="24" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
