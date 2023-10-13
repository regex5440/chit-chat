import React, { useRef, useState } from "react";
import { MicrophoneIcon, PaperClipIcon, SmileyEmoji } from "../../../../assets/icons";
import { useDebounce } from "../../../../utils";
import "./chat_input.sass";
import { useDispatch, useSelector } from "react-redux";
import { addMessageThunk, updateTypingThunk } from "../../../../library/redux/reducers";
import { getTempConnection } from "../../../../library/redux/selectors";

const ChatInput = ({ scrollToBottom }) => {
  const [input, setInput] = useState("");
  const dispatch = useDispatch();
  const typingStarted = useRef(false);
  const tempContact = useSelector(getTempConnection);
  const debouncedInput = useDebounce(() => {
    typingStarted.current = false;
    dispatch(updateTypingThunk(false));
  }, 1000);

  const inputHandler = () => {
    if (!typingStarted.current) {
      typingStarted.current = true;
      dispatch(updateTypingThunk(true));
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    let message = e.target[0].value;
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
      e.target[0].value = "";
    }
  };

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
          <input type="text" placeholder="Type a message or send a voice note" onChange={debouncedInput} onInput={inputHandler} autoFocus={tempContact?.restricted ? false : true} />
        </form>
        <div className="option__voice-note click-icon not-allowed" title="Voice Message">
          <MicrophoneIcon height="24" width="24" />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
