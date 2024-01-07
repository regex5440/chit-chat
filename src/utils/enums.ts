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
    AttachmentURL: "getSignedURL",
    LoadMore: "loadMoreMessages",
    MoreMessages: "moreMessageFromServer",
  },
  CONNECTION: {
    ConnectionData: "connectionsWithChat",
    RemoveConnection: "RemoveConnection",
    StatusUpdate: "lastSeenUpdate",
    PictureUpdate: "profilePicUpdate",
  },
  RTC_SIGNALING: {
    Offer: "Offer",
    Answer: "Answer",
    Candidate: "iceCandidate",
    End: "endRTCConnection",
    Reconnect: "reconnectionRequest",
    Reconnect_RESP: "reconnectionResponse",
    CallInitiator: "callInitiator",
    CallInitiator_RESP: "responseToCallInitiator",
  },
};

enum MenuOptionType {
  BLOCKED_LIST = "BLOCKED_LIST",
  UPDATE_PROFILE = "UPDATE_PROFILE",
  APP_SETTINGS = "APP_SETTINGS",
}

enum CALL_STATUS {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  REJECTED = "rejected",
  DISCONNECTED = "disconnected",
  WAITING = "waiting",
  IDLE = "idle",
  RECONNECTING = "reconnecting",
  NO_RESPONSE = "no response",
}

export { USER_STATUSES, SOCKET_HANDLERS, MenuOptionType, CALL_STATUS };
