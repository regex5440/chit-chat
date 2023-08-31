import { io } from "socket.io-client";
import { SOCKET_HANDLERS } from "../../utils/enums";
import { addTypingAuthors, updateChat } from "../redux/reducers";
import { useDispatch } from "react-redux";
import { useEffect } from "react";

const socket = io(import.meta.env.CC_ServerDomain, {
  extraHeaders: {
    Authorization: localStorage.getItem("accessToken"),
  },
});

const sendMessage = async (chat_id, message_object) => {
  socket.emit(SOCKET_HANDLERS.CHAT.newMessage, chat_id, message_object);
};

const updateTyping = async (chat_id, { authorId, isTyping }) => {
  socket.emit(SOCKET_HANDLERS.CHAT.typingStatusUpdate, chat_id, { authorId, isTyping });
};

export const SocketComponent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Typing Status update
    socket.on(SOCKET_HANDLERS.CHAT.typingStatusUpdate, (chat_id, authors_typing_array) => {
      dispatch(addTypingAuthors({ chat_id, authors_typing: authors_typing_array }));
    });

    // New Message
    socket.on(SOCKET_HANDLERS.CHAT.newMessage, (chat_id, update) => {
      dispatch(updateChat({ chat_id, ...update }));
    });
  }, [dispatch]);
  return <></>;
};
export default socket;
export { sendMessage, updateTyping };
