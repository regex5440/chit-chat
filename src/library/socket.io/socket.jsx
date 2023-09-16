import { SOCKET_HANDLERS } from "../../utils/enums";
import { addInitialData, addNewConnectionRequested, addTypingAuthors, resetSocketData, updateChat, updateChatSeenStatus } from "../redux/reducers";
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
    socket.on(SOCKET_HANDLERS.CONNECTION_DATA, (data) => {
      dispatch(addInitialData(data));
    });

    // New Message Request Sent
    socket.on(SOCKET_HANDLERS.CHAT.NewRequest_Success, (data) => {
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
  }, [dispatch]);
};
export { sendMessage, updateTyping, sendMessageSeenUpdate };
