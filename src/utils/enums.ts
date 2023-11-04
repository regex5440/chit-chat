const USER_STATUSES = {
  ONLINE: {
    code: "ONLINE",
    color: `rgb(0, 209, 0)`,
    palleteColor: `rgb(0, 230, 176)`,
  },
  OFFLINE: {
    code: "OFFLINE",
    color: `rgb(245, 0, 0)`,
    palleteColor: `rgb(239, 129, 31)`,
  },
};

const SOCKET_HANDLERS = {
  CHAT: {
    JoinRoom: "newChatRequestedRoom",
    LeaveRoom: "leaveDeleteChatRoom",
    NewMessage: "chatUpdate/message",
    TypingUpdate: "chatUpdate/typingStatus",
    NewRequest: "newChatRequest",
    NewRequest_Success: "newChatRequestSuccess",
    NewRequest_Accepted: "newMessageRequestAccepted",
    NewRequest_Failed: "cannotSendRequest",
    SeenUpdate: "newSeenUpdate",
    ClearAll: "removeAllMessages",
    MESSAGE: {
      Delete: "deleteMessage",
      Edit: "editMessage",
    },
  },
  CONNECTION: {
    ConnectionData: "connectionsWithChat",
    RemoveConnection: "RemoveConnection",
    StatusUpdate: "lastSeenUpdate",
    PictureUpdate: "profilePicUpdate",
  },
};

export { USER_STATUSES, SOCKET_HANDLERS };
