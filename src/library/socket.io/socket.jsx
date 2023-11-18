import { SOCKET_HANDLERS } from "../../utils/enums";
import { addInitialData, addNewConnectionRequested, addParticipants, addTypingAuthors, clearChat, deleteContact, resetSocketData, updateChat, updateChatSeenStatus, updateUserStatus } from "../redux/reducers";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getUserData } from "../redux/selectors";
import { getLoginStateToken } from "../../utils";
import { io } from "socket.io-client";
import { deleteMessage, updateMessage } from "../redux/reducers/user_appData";

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

const deleteMessageSocket = (chatId, messageId, fromId, forAll = false) => {
  socket.emit(SOCKET_HANDLERS.CHAT.MESSAGE.Delete, chatId, messageId, fromId, forAll);
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
  }, [dispatch, userId]);
};
export { acceptRequest, clearChatSocket, deleteMessageSocket, editMessage, getSignedURL, sendMessage, updateTyping, sendMessageSeenUpdate, removeConnection, statusUpdate };
