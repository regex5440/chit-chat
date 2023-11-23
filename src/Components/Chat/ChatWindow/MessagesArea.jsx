import React, { useCallback, useEffect, useRef, useState } from "react";
import "./message_area.sass";
import { BouncyBalls, CircularLoader, DropDown, LazyLoader, Modal } from "hd-ui";
import { capitalize, convertBytes, copyToClipboard, dateComparer, dateDifference, getAssetURL, getFormattedDate, getFormattedTime, msToDays, triggerDownload } from "../../../utils";
import { useDispatch, useSelector } from "react-redux";
import { contactsChat, getSelectedFiles, getUserData, unseenMsgCountSelectedContact } from "../../../library/redux/selectors";
import ChatInput from "./ChatInput";
import { DoubleTickIcon, ExclamationIcon, SentIcon } from "../../../assets/icons";
import { sendMessageSeenThunk } from "../../../library/redux/reducers";
import { ClockIcon, CopyIcon, Cross1Icon, Cross2Icon, DownloadIcon, FileIcon, FileTextIcon, OpenInNewWindowIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { deleteMessageThunk, editMessageThunk } from "../../../library/redux/reducers/user_appData";
import FilePreviewer from "../../Common/FilePreviewer";

const Message = ({ messageObject, ContactId, ChatId, deleteMessage, editMessage }) => {
  const dispatch = useDispatch();
  const messageContainer = useRef(null);
  const unseenMessagesCount = useSelector(unseenMsgCountSelectedContact);
  const isMine = messageObject.sender_id !== ContactId;
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
    if (messageObject.attachments?.length > 0) {
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
  const renderAttachments = () => {
    const attachments = messageObject.attachments || [];
    if (attachments.length === 0) return null;
    let maxImageCountToShow = Math.min(attachments.length, 6);
    return (
      <div className="message-attachments-container" data-has_text={messageObject.text.length > 0} data-image_count={attachments.length}>
        {attachments.slice(0, maxImageCountToShow).map((file, index) => {
          if (messageObject.type === "image") {
            return (
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <div className="image">
                    <img src={getAssetURL(file.key)} loading="lazy" />
                    {attachments.length > 6 && index === 5 && <div className="image-count">+{attachments.length - 6}</div>}
                  </div>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="attachment-previewer-overlay" />
                  <Dialog.Content
                    className="attachment-previewer"
                    onContextMenu={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <FilePreviewer
                      files={attachments}
                      previewerMode="receive"
                      fileType={messageObject.type}
                      defaultSelectedIndex={index}
                      header={
                        <div className="preview-header">
                          <div>
                            <Dialog.Title className="title" style={{ margin: 0, lineHeight: 0 }}>
                              Attachment
                            </Dialog.Title>
                            <Dialog.Description>{attachments.length} Files</Dialog.Description>
                          </div>
                          <div className="file-actions">
                            <div className="btn" title={"Download"} onClick={() => triggerDownload(getAssetURL(file.key))}>
                              <DownloadIcon height={25} width={25} />
                            </div>
                            <Dialog.Close asChild title="Close Previewer">
                              <Cross1Icon className="btn" height={25} width={25} />
                            </Dialog.Close>
                          </div>
                        </div>
                      }
                    />
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            );
          } else {
            return (
              <div className="file">
                <div className="file-info">
                  <FileTextIcon height={50} width={50} className="icon" />
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{convertBytes(file.size)}</div>
                </div>
                <div className="file-actions">
                  {file?.key?.endsWith(".pdf") && (
                    <button
                      className="btn"
                      title="Open"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(getAssetURL(file.key), "_blank");
                      }}
                    >
                      <OpenInNewWindowIcon height={16} width={16} /> Open
                    </button>
                  )}
                  <button
                    className="btn"
                    title="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDownload(getAssetURL(file.key), file.name);
                    }}
                  >
                    <DownloadIcon height={16} width={16} /> Download
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };
  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div className="message message-box" data-mine={isMine} ref={messageContainer} data-emojionly={messageObject.type === "text" && messageObject.text.match(/^[\p{Emoji}\s]+$/u)?.[0].match(/[^0-9]+/g)?.[0] ? true : false} data-type={messageObject.type}>
            {isMine && <span className="message-status">{messageStatus}</span>}
            {renderAttachments()}
            {messageObject.text && <span className="message-text">{messageObject.text}</span>}
            <span className="message-time">
              {messageObject.edited && <em>Edited</em>}
              {getFormattedTime(messageObject.timestamp, "h:mm")}
            </span>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content className="message-options-menu">
            {/* <DropDownMenu.Arrow /> */}
            {messageObject.type === "text" && (
              <ContextMenu.Item className="option" onClick={copyHandler}>
                <CopyIcon />
                <div>Copy</div>
              </ContextMenu.Item>
            )}
            {messageObject.type === "text" && isMine && (
              <ContextMenu.Item className="option" onClick={() => editMessage(messageObject)}>
                <Pencil2Icon />
                <div>Edit</div>
              </ContextMenu.Item>
            )}
            <ContextMenu.Item className="option" onClick={() => deleteMessage({ id: messageObject.id, isMine })}>
              <TrashIcon />
              <div>Delete</div>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
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
  const selectedAttachmentFiles = useSelector(getSelectedFiles);
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
        {selectedAttachmentFiles.length > 0 && <FilePreviewer files={selectedAttachmentFiles} previewerMode="send" fileType={selectedAttachmentFiles.at(0)?.type} />}
      </div>
      <ChatInput scrollToBottom={scrollToBottom} editableMessage={oldMessage} editHandler={editHandler} chatId={chat.chat_id} />
    </>
  );
};

export default MessagesArea;
