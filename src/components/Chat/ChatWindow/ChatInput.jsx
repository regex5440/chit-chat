import React, { useEffect, useRef, useState } from "react";
import { MicrophoneIcon, PaperClipIcon, SendIcon, SmileyEmoji } from "../../../assets/icons";
import { convertBytes, useDebounce } from "../../../utils";
import "./chat_input.sass";
import { useDispatch, useSelector } from "react-redux";
import { addMessageThunk, updateSelectedFiles, updateTypingThunk } from "../../../library/redux/reducers";
import { getDeviceDetails, getSelectedFiles, getTempConnection, getTheme } from "../../../library/redux/selectors";
import EmojiPicker from "emoji-picker-react";
import * as PopOver from "@radix-ui/react-popover";
import * as DropDownMenu from "@radix-ui/react-dropdown-menu";
import { FileIcon, ImageIcon } from "@radix-ui/react-icons";
import { getSignedURL } from "../../../library/socket.io/socket";
import axios from "axios";
import { LinearLoader } from "hd-ui";

/**
 * A component that renders a chat input field with options to send text messages and emoticons.
 * @param {Object} props - The component props.
 * @param {Function} props.scrollToBottom - A function to scroll to the bottom of the chat window.
 * @param {Object} props.editableMessage - An optional message object to edit.
 * @param {Function} props.editHandler - A function to handle editing of a message.
 * @returns {JSX.Element} - The ChatInput component.
 */
const ChatInput = ({ scrollToBottom, editableMessage, editHandler, chatId }) => {
  const [messageText, setInput] = useState(editableMessage?.text || "");
  const dispatch = useDispatch();
  const typingStarted = useRef(false);
  const textArea = useRef(null);
  const tempContact = useSelector(getTempConnection);
  const deviceDetails = useSelector(getDeviceDetails);
  const theme = useSelector(getTheme);
  const attachmentFiles = [...useSelector(getSelectedFiles)];
  const [sendingAttachments, setSendingAttachments] = useState(false);
  const [visibleEmojiContainer, setEmojiContainerVisible] = useState(false);
  const [visibleAttachmentPicker, setVisibleAttachmentPicker] = useState(false);
  const debouncedInput = useDebounce(() => {
    typingStarted.current = false;
    dispatch(updateTypingThunk(false));
  }, 1000);

  useEffect(() => {
    if (editableMessage) {
      setInput(editableMessage.text);
    }
  }, [editableMessage]);
  useEffect(() => {
    if (deviceDetails.type === "mobile") {
      setTimeout(() => {
        textArea.current?.focus();
      }, 500);
    } else {
      textArea.current?.focus();
    }
    if (textArea.current) {
      textArea.current.onfocus = () => {
        setEmojiContainerVisible(false);
        setVisibleAttachmentPicker(false);
      };
    }
    return () => {
      if (textArea.current) textArea.current.onfocus = undefined;
    };
  }, []);

  const inputHandler = (e) => {
    setInput(e.target.value);
    if (!typingStarted.current) {
      typingStarted.current = true;
      dispatch(updateTypingThunk(true));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    let message = messageText;
    if (message && attachmentFiles.length === 0) {
      // 1 Send the message
      if (editableMessage) {
        editHandler(message);
      } else {
        dispatch(
          addMessageThunk({
            text: message,
            timestamp: new Date().toISOString(),
            type: "text",
            tempId: crypto.randomUUID(),
          })
        );
      }
      // scroll to the bottom
      scrollToBottom();
      // 3 Empty the input
      setInput("");
    } else if (attachmentFiles.length > 0) {
      if (editableMessage) {
        editHandler(message);
      } else {
        if (!chatId) return window.alert("You cannot send attachments as a new message, try sending a text message first.");
        setSendingAttachments(true);
        try {
          const signedURLs = await getSignedURL(chatId, attachmentFiles);
          if (signedURLs?.length > 0) {
            dispatch(updateSelectedFiles([]));
            scrollToBottom();
            setInput("");
            const uploadPromises = [];
            const attachmentsData = [];
            for (let fI = 0; fI < attachmentFiles.length; fI++) {
              const file = attachmentFiles[fI];
              uploadPromises.push(
                new Promise(async (resolve, reject) => {
                  try {
                    const fileBlob = await fetch(file.url).then((r) => r.blob());
                    const response = await axios.put(signedURLs[fI].signed_url, fileBlob, {
                      headers: {
                        "Content-Type": fileBlob.type,
                      },
                      onUploadProgress: (progressEvent) => {
                        console.log(`Uploaded ${file.name}:\t${(progressEvent.progress * 100).toFixed(2)}% \nRate: ${progressEvent.rate} \t ETA: ${progressEvent.estimated} `);
                      },
                    });
                    if (response.status === 200) {
                      attachmentsData[fI] = {
                        name: file.name,
                        size: file.size,
                        key: signedURLs[fI].key,
                      };
                      resolve();
                    } else {
                      throw new Error("Unable to upload file");
                    }
                  } catch (err) {
                    reject(err);
                  }
                })
              );
            }
            await Promise.all(uploadPromises);
            dispatch(
              addMessageThunk({
                text: message,
                timestamp: new Date().toISOString(),
                type: attachmentFiles[0].type,
                tempId: crypto.randomUUID(),
                attachments: attachmentsData,
              })
            );
          } else {
            throw new Error("Unable to get signed url");
          }
        } catch (err) {
          window.alert("Something went wrong. Please try again later.");
          console.log(err);
        } finally {
          setSendingAttachments(false);
        }
      }
    }
  };

  /**
   * @param {String} type - The type of attachment to be sent [image, document]
   * @returns {void}
   */
  const attachmentHandler = (type) => {
    const imageInput = document.createElement("input");
    imageInput.type = "file";
    if (type === "image") {
      imageInput.accept = "image/*";
    }
    imageInput.multiple = true;
    imageInput.click();
    imageInput.onchange = (e) => {
      const files = e.target.files;
      let allFilesUnderSize = true;
      let cumulativeSize = 0; //MB
      const serializedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSize = convertBytes(file.size, "MB");
        if (fileSize > 25) {
          alert("File size should be less than 25 MB");
          allFilesUnderSize = false;
          break;
        }
        cumulativeSize += fileSize;
        if (cumulativeSize > 100) {
          alert("Total size of files should be less than 100 MB");
          allFilesUnderSize = false;
          break;
        }
        serializedFiles.push({ url: URL.createObjectURL(file), name: file.name, type, size: file.size });
      }

      if (allFilesUnderSize) {
        setVisibleAttachmentPicker(false);
        dispatch(updateSelectedFiles(serializedFiles));
      }
    };
  };
  const showEmojiContainer = () => {
    setVisibleAttachmentPicker(false);
    setEmojiContainerVisible((state) => !state);
  };
  const showAttachmentPicker = () => {
    setEmojiContainerVisible(false);
    setVisibleAttachmentPicker((state) => !state);
  };

  return (
    <>
      {sendingAttachments && <LinearLoader height="5px" width="100%" riderColor="var(--icon-stroke)" trackColor="var(--window-background)" withProgress={false} />}
      <div className="user-chat-option" data-unselectable={tempContact?.restricted ? true : false}>
        <div className="user-chat-option__container option">
          {deviceDetails.type !== "mobile" ? (
            <PopOver.Root>
              <PopOver.Trigger asChild>
                <div className="option__emoji click-icon" title="Emoticons">
                  <SmileyEmoji height="24" width="24" />
                </div>
              </PopOver.Trigger>
              <PopOver.Portal>
                <PopOver.Content>
                  <EmojiPicker
                    width={300}
                    onEmojiClick={(emoji) => {
                      setInput((prev) => prev + emoji.emoji);
                    }}
                    autoFocusSearch={true}
                    theme={theme.preferred === "dark" ? "dark" : "light"}
                    previewConfig={{ showPreview: false }}
                  />
                  <PopOver.Arrow style={{ fill: "var(--window-background)" }} />
                </PopOver.Content>
              </PopOver.Portal>
            </PopOver.Root>
          ) : (
            <div className="option__emoji click-icon" title="Emoticons" onMouseDown={showEmojiContainer}>
              <SmileyEmoji height="24" width="24" />
            </div>
          )}
          {deviceDetails.type !== "mobile" ? (
            <DropDownMenu.Root>
              <DropDownMenu.Trigger asChild>
                <div className="option__attachments click-icon" title="Attachments">
                  <PaperClipIcon height="24" width="24" />
                </div>
              </DropDownMenu.Trigger>
              <DropDownMenu.Portal>
                <DropDownMenu.Content className="chat-input__attachment-options">
                  <DropDownMenu.Item className="attachment-option" onClick={() => attachmentHandler("image")}>
                    <span className="icon">
                      <ImageIcon height="26" width="26" />
                    </span>
                    <span className="text">Image</span>
                  </DropDownMenu.Item>
                  <DropDownMenu.Item className="attachment-option" onClick={() => attachmentHandler("document")}>
                    <span className="icon">
                      <FileIcon height="26" width="26" />
                    </span>
                    <span className="text">Document</span>
                  </DropDownMenu.Item>
                  <DropDownMenu.Arrow style={{ fill: "var(--window-background)" }} />
                </DropDownMenu.Content>
              </DropDownMenu.Portal>
            </DropDownMenu.Root>
          ) : (
            <div className="option__attachments click-icon" title="Attachments" onMouseDown={showAttachmentPicker}>
              <PaperClipIcon height="24" width="24" />
            </div>
          )}
          <form className="option__input" onSubmit={submitHandler}>
            {deviceDetails.type === "mobile" ? <textarea placeholder="Type a message or send a voice note" onChange={debouncedInput} onInput={inputHandler} value={messageText} ref={textArea} /> : <input type="text" placeholder="Type a message or send a voice note" onChange={debouncedInput} onInput={inputHandler} value={messageText} ref={textArea} />}
          </form>
          {messageText || attachmentFiles.length > 0 ? (
            <div className="option__send-text click-icon" title="Send" onClick={submitHandler}>
              <SendIcon height="24" width="24" fill="var(--icon-stroke)" />
            </div>
          ) : (
            <div className="option__voice-note click-icon not-allowed" title="Voice Message">
              <MicrophoneIcon height="24" width="24" />
            </div>
          )}
        </div>
        {visibleEmojiContainer && (
          <EmojiPicker
            width={"100%"}
            height={300}
            onEmojiClick={(emoji) => {
              setInput((prev) => prev + emoji.emoji);
            }}
            theme={theme.preferred === "dark" ? "dark" : "light"}
            previewConfig={{ showPreview: false }}
            autoFocusSearch={false}
            searchDisabled={true}
          />
        )}
        {visibleAttachmentPicker && (
          <div className="chat-input__attachment-options" data-device="mobile">
            <div className="attachment-option" onClick={() => attachmentHandler("image")}>
              <span className="icon">
                <ImageIcon height="26" width="26" />
              </span>
              <span className="text">Image</span>
            </div>
            <div className="attachment-option" onClick={() => attachmentHandler("document")}>
              <span className="icon">
                <FileIcon height="26" width="26" />
              </span>
              <span className="text">Document</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatInput;
