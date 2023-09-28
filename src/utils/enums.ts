import { getExportedVariables } from ".";
//@ts-ignore
import themeVariables from "@theme-variables";

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
    JoinRoom: 'newChatRequestedRoom',
    NewMessage: "chatUpdate/message",
    TypingUpdate: "chatUpdate/typingStatus",
    NewRequest: "newChatRequest",
    NewRequest_Success: "newChatRequestSuccess",
    SeenUpdate: "newSeenUpdate",
    ClearAll: 'removeAllMessages'
  },
  CONNECTION: {
    ConnectionData: "connectionsWithChat",
    RemoveConnection: 'RemoveConnection',
    StatusUpdate: 'lastSeenUpdate',
    PictureUpdate: 'profilePicUpdate'
  }
};

const THEME_VARIABLES = getExportedVariables(themeVariables);

export { USER_STATUSES, THEME_VARIABLES, SOCKET_HANDLERS };
