import { SOCKET_HANDLERS } from "../../utils/enums";
import { addInitialData, addNewConnectionRequested, addParticipants, addTypingAuthors, clearChat, deleteContact, resetSocketData, showCallerComponent, updateChat, updateChatSeenStatus, updateUserStatus } from "../redux/reducers";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getUserData } from "../redux/selectors";
import { getLoginStateToken } from "../../utils";
import { io } from "socket.io-client";
import { deleteMessage, updateMessage } from "../redux/reducers/user_appData";
import RTCElement from "../../context/rtc_eventElement";
import { RTCEndEvent, RTCIceReceived, RTCReconnectEvent, RTCRemoteDescription } from "../../utils/events";

let socket = null;

const sendMessage = async ({ chat_id, receiverId }, messageObject, newMessageRequest = false) => {
  return new Promise((resolve, reject) => {
    socket.emit(newMessageRequest ? SOCKET_HANDLERS.CHAT.NewRequest : SOCKET_HANDLERS.CHAT.NewMessage, { receiverId, messageObject, chat_id });
    const timer = setTimeout(reject, 10000);
    socket.on(newMessageRequest ? SOCKET_HANDLERS.CHAT.NewRequest_Success : SOCKET_HANDLERS.CHAT.NewMessage, (chat_id, last_updated, messageObject) => {
      clearTimeout(timer);
      resolve({ chat_id, last_updated, messageObject });
    });
  });
};

const getSignedURL = async (chat_id, filesInfo = []) =>
  new Promise((resolve, reject) => {
    socket.emit(SOCKET_HANDLERS.CHAT.AttachmentURL, chat_id, filesInfo);
    const timer = setTimeout(reject, 10000);
    socket.on(SOCKET_HANDLERS.CHAT.AttachmentURL, (signedURLs) => {
      clearTimeout(timer);
      resolve(signedURLs);
    });
  });

const updateTyping = async (chat_id, { authorId, isTyping }) => {
  socket.emit(SOCKET_HANDLERS.CHAT.TypingUpdate, chat_id, { authorId, isTyping });
};

const sendMessageSeenUpdate = (chat_id, fromUserId, toUserId, messageId) => {
  socket.emit(SOCKET_HANDLERS.CHAT.SeenUpdate, chat_id, fromUserId, toUserId, messageId);
};

const clearChatSocket = async (chatId, fromId, toId) => {
  socket.emit(SOCKET_HANDLERS.CHAT.ClearAll, { chatId, fromId, toId });
};

const removeConnection = async (chat_id, fromUserId, toUserId, toBlock = false) => {
  socket.emit(SOCKET_HANDLERS.CONNECTION.RemoveConnection, chat_id, { fromUserId, toUserId, toBlock });
};

const statusUpdate = (userId, { code, update_type }) => {
  socket.emit(SOCKET_HANDLERS.CONNECTION.StatusUpdate, userId, { code, update_type });
};

const acceptRequest = (chatId, userId) => {
  socket.emit(SOCKET_HANDLERS.CHAT.NewRequest_Accepted, chatId, userId);
};

const editMessage = (chatId, messageId, update, fromId) => {
  socket.emit(SOCKET_HANDLERS.CHAT.MESSAGE.Edit, chatId, messageId, update, fromId);
};

const deleteMessageSocket = ({ chatId, messageId, fromId, attachments }, forAll = false) => {
  socket.emit(SOCKET_HANDLERS.CHAT.MESSAGE.Delete, { chatId, messageId, fromId, attachments }, forAll);
};

const requestMoreMessage = (chatId, dataCount, size = 20) => {
  socket.emit(SOCKET_HANDLERS.CHAT.LoadMore, chatId, { dataCount, size });
  return new Promise((res, rej) => {
    setTimeout(rej, 10000);
    socket.on(SOCKET_HANDLERS.CHAT.MoreMessages, (chatId, data) => {
      res(data);
    });
  });
};

export const SocketComponent = () => {
  const dispatch = useDispatch();
  const {
    data: { id: userId },
  } = useSelector(getUserData);

  useEffect(() => {
    socket = io(import.meta.env.CC_ServerDomain, {
      extraHeaders: {
        Authorization: `Bearer ${getLoginStateToken()}`,
      },
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.on("disconnect", (reason) => {
      console.log("SOCKET ERROR:", reason);
      dispatch(resetSocketData());
    });
    // Connections Data
    socket.on(SOCKET_HANDLERS.CONNECTION.ConnectionData, (data) => {
      dispatch(addInitialData(data));
    });

    // New Message Request Sent
    socket.on(SOCKET_HANDLERS.CHAT.NewRequest_Success, (data) => {
      socket.emit(SOCKET_HANDLERS.CHAT.JoinRoom, data.chat.chat_id);
      dispatch(addNewConnectionRequested(data));
    });

    // Typing Status update
    socket.on(SOCKET_HANDLERS.CHAT.TypingUpdate, (chat_id, { authorId, isTyping }) => {
      if (authorId === userId) return;
      dispatch(addTypingAuthors({ chat_id, authorId, isTyping }));
    });

    // New Message
    socket.on(SOCKET_HANDLERS.CHAT.NewMessage, (chat_id, last_updated, message) => {
      if (message.sender_id === userId) return;
      dispatch(updateChat({ chat_id, last_updated, message }));
    });

    socket.on(SOCKET_HANDLERS.CHAT.MESSAGE.Delete, (chatId, messageId) => {
      dispatch(deleteMessage({ chatId, messageId }));
    });

    socket.on(SOCKET_HANDLERS.CHAT.MESSAGE.Edit, (chatId, messageId, update, fromId) => {
      if (fromId === userId) return;
      dispatch(updateMessage({ chatId, messageId, update, fromId }));
    });

    // Seen Update
    socket.on(SOCKET_HANDLERS.CHAT.SeenUpdate, (chat_id, fromUserId, messageId) => {
      if (fromUserId !== userId) {
        dispatch(updateChatSeenStatus({ chat_id, fromUserId, messageId }));
      }
    });

    // Status Update
    socket.on(SOCKET_HANDLERS.CONNECTION.StatusUpdate, (id, update) => {
      console.log("Status Updated", id, update);
      dispatch(updateUserStatus({ userId: id, update, self: id === userId }));
    });

    // Clear Chat
    socket.on(SOCKET_HANDLERS.CHAT.ClearAll, (chatId, fromId) => {
      dispatch(clearChat({ chatId, fromId }));
    });

    // Delete Contact
    socket.on(SOCKET_HANDLERS.CONNECTION.RemoveConnection, (contactId, chatId) => {
      dispatch(deleteContact({ contactId, chatId }));
      socket.emit(SOCKET_HANDLERS.CHAT.LeaveRoom, chatId);
    });

    socket.on(SOCKET_HANDLERS.CHAT.NewRequest_Accepted, (chatId, id) => {
      if (id !== userId) {
        dispatch(addParticipants({ chatId, id }));
      }
    });

    socket.on(SOCKET_HANDLERS.CHAT.NewRequest_Failed, (message) => {
      window.alert(message);
    });

    //RTC Signaling
    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.CallInitiator, (chatId, callType, fromUserId) => {
      dispatch(showCallerComponent({ byUser: false, callType, chatId, contactId: fromUserId }));
    });
    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.Reconnect, (chatId, fromUserId) => {
      RTCElement.ReconnectionOffer = "received";
      RTCElement.dispatchEvent(RTCReconnectEvent);
    });
    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.Offer, (description) => {
      // dispatch(setRemoteDescription(description));
      RTCElement.remoteSDP = description;
      RTCElement.dispatchEvent(RTCRemoteDescription);
    });

    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.Answer, (description) => {
      RTCElement.remoteSDP = description;
      RTCElement.dispatchEvent(RTCRemoteDescription);
    });
    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.Candidate, (candidate) => {
      if (!RTCElement.iceCandidate) {
        RTCElement.iceCandidate = candidate;
      }
      RTCElement.dispatchEvent(RTCIceReceived);
    });
    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.End, () => {
      RTCElement.dispatchEvent(RTCEndEvent);
    });
  }, [dispatch, userId]);
};
export const sendCallInitiator = async (chatId, callType, userId) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.CallInitiator, chatId, callType, userId);
  return new Promise((resolve, reject) => {
    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.CallInitiator_RESP, (personId) => {
      timer && clearInterval(timer);
      resolve(personId);
    });
    var timer = setInterval(() => {
      socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.CallInitiator, chatId, callType, userId);
    }, 2000);
    setTimeout(() => {
      clearInterval(timer);
      reject("No Response");
    }, 60 * 1000);
  });
};

export const sendReconnectInitiator = async (chatId, userId) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.Reconnect, chatId, userId);
  return new Promise((resolve, reject) => {
    socket.on(SOCKET_HANDLERS.RTC_SIGNALING.Reconnect_RESP, (personId) => {
      timer && clearInterval(timer);
      resolve(personId);
    });
    var timer = setInterval(() => {
      socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.Reconnect, chatId, userId);
    }, 2000);
    setTimeout(() => {
      clearInterval(timer);
      reject("No Response");
    }, 15 * 1000);
  });
};

export const sendReconnectInitiatorResponse = (chatId, personId) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.Reconnect_RESP, chatId, personId);
};

export const sendCallInitiatorResponse = (chatId, personId) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.CallInitiator_RESP, chatId, personId);
};
export const sendOffer = (chatId, desc) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.Offer, chatId, desc);
};
export const sendAnswer = (chatId, msg) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.Answer, chatId, msg);
};
export const sendCandidate = (chatId, msg) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.Candidate, chatId, msg);
};
export const endCall = (chatId) => {
  socket.emit(SOCKET_HANDLERS.RTC_SIGNALING.End, chatId);
};

export { acceptRequest, clearChatSocket, deleteMessageSocket, editMessage, getSignedURL, sendMessage, updateTyping, sendMessageSeenUpdate, removeConnection, statusUpdate, requestMoreMessage };
