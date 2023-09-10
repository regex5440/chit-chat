import { getExportedVariables } from ".";
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
    newMessage: "chatUpdate/message",
    typingStatusUpdate: "chatUpdate/typingStatus",
    newRequest: "newChatRequest",
    newRequstSuccess: "newChatRequestSuccess",
  },
};

const THEME_VARIABLES = getExportedVariables(themeVariables);

export { USER_STATUSES, THEME_VARIABLES, SOCKET_HANDLERS };
