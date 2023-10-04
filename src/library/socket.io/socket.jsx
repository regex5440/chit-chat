import { SOCKET_HANDLERS } from "../../utils/enums";
import { addInitialData, addNewConnectionRequested, addParticipants, addTypingAuthors, clearChat, deleteContact, resetSocketData, updateChat, updateChatSeenStatus, updateUserStatus } from "../redux/reducers";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getUserData } from "../redux/selectors";
import { getLoginStateToken } from "../../utils";
import { io } from "socket.io-client";

let socket = null;

const sendMessage = async ({ chat_id, receiverId }, messageObject, newMessageRequest = false) => {
  socket.emit(newMessageRequest ? SOCKET_HANDLERS.CHAT.NewRequest : SOCKET_HANDLERS.CHAT.NewMessage, { receiverId, messageObject, chat_id });
};

const updateTyping = async (chat_id, { authorId, isTyping }) => {
  socket.emit(SOCKET_HANDLERS.CHAT.TypingUpdate, chat_id, { authorId, isTyping });
};

const sendMessageSeenUpdate = (chat_id, fromUserId, toUserId) => {
  socket.emit(SOCKET_HANDLERS.CHAT.SeenUpdate, chat_id, fromUserId, toUserId);
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

    // Seen Update
    socket.on(SOCKET_HANDLERS.CHAT.SeenUpdate, (chat_id, fromUserId) => {
      if (fromUserId !== userId) {
        dispatch(updateChatSeenStatus(chat_id, fromUserId));
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
  }, [dispatch, userId]);
};
export { acceptRequest, clearChatSocket, sendMessage, updateTyping, sendMessageSeenUpdate, removeConnection, statusUpdate };
