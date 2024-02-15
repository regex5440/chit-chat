import store from "../library/redux/store";
import { DateParam } from "./types";
import { debounce, capitalize } from "./common";
import { useDebounce, useUniqueRequest } from "./hooks.dev";
//@ts-ignore
import dummyProfileUrl from "../assets/dummy_profile_pic.jpg";

function getRandom0To255(): number {
  return Math.floor(Math.random() * 255);
}

function getExportedVariables(exportString: string) {
  if (!exportString) throw new Error("SASSVariableImport Error: Provide a valid sass export string");

  const jsonParsableString = exportString
    .replace(/[\n\s]+/g, "") // Remove all newlines
    .replace(/\;/g, (match, position, input) => {
      // Replace CSS seperator (;) with JS seperator (,)
      if (position === input.length - 2) {
        return "";
      }
      return ",";
    })
    .replace(/([\w]+)\:([\-\#\w]+)/g, (globalMatch, groupOneMatch, groupTwoMatch) => {
      // Wrap keys and values with double quotes
      return `"${groupOneMatch}":"${groupTwoMatch}"`;
    });

  const exportMatch = jsonParsableString.match(/(\{[\w\:\,\#\'\"]+\})/gim);

  if (exportMatch) {
    try {
      return JSON.parse(exportMatch[0]);
    } catch (e) {
      console.error("Unable to parse the SASS String,\n", e, {
        exportString,
        jsonParsableString,
        exportMatch,
      });
      return {};
    }
  } else {
    throw new Error(`SASSVariableImport Error: Sass string does not contain a possible or valid export\n${exportString}`);
  }
}

const getFormattedDate = (data: DateParam, format = `dd-mmm-yy, www`) => {
  let dateObject: Date;
  if (typeof data === "number") {
    dateObject = new Date(data);
  } else if (typeof data === "string") {
    dateObject = new Date(Date.parse(data));
  } else {
    dateObject = data;
  }

  const desiredFormat = {
    date: format.match(/d/gi)?.length || 0,
    month: format.match(/m/gi)?.length || 0,
    year: format.match(/y/gi)?.length || 0,
    day: format.match(/w/gi)?.length || 0,
  };
  let monthOption: "numeric" | "2-digit" | "short" | "long" | undefined = undefined;
  let dayOption: "short" | "narrow" | "long" | undefined = undefined;
  switch (desiredFormat.month) {
    case 1:
      monthOption = "numeric";
      break;
    case 2:
      monthOption = "2-digit";
      break;
    case 3:
      monthOption = "short";
      break;
    case 4:
      monthOption = "long";
      break;
  }
  switch (desiredFormat.day) {
    case 1:
      dayOption = "narrow";
      break;
    case 2:
      dayOption = "short";
      break;
    case 3:
      dayOption = "short";
      break;
    case 4:
      dayOption = "long";
      break;
    default:
      dayOption = undefined;
  }

  const dateFormatter = Intl.DateTimeFormat(undefined, {
      day: desiredFormat.date >= 2 ? "2-digit" : "numeric",
    }),
    monthFormatter = Intl.DateTimeFormat(undefined, {
      month: monthOption,
    }),
    yearFormatter = Intl.DateTimeFormat(undefined, {
      year: desiredFormat.year === 2 ? "2-digit" : "numeric",
    }),
    dayFormatter = Intl.DateTimeFormat(undefined, {
      weekday: dayOption,
    });

  let formattedDate = format.replace(/[dmyw]+/g, (match: string) => {
    switch (match.charAt(0).toLowerCase()) {
      case "d":
        return dateFormatter.format(dateObject);
      case "m":
        return monthFormatter.format(dateObject);
      case "y":
        return yearFormatter.format(dateObject);
      case "w":
        return dayFormatter.format(dateObject);
      default:
        return "0";
    }
  });

  return formattedDate;
};

const getFormattedTime = (data: DateParam, format = "hh:mm:ss") => {
  let dateObject: Date;
  if (typeof data === "number") {
    dateObject = new Date(data);
  } else if (typeof data === "string") {
    dateObject = new Date(Date.parse(data));
  } else {
    dateObject = data;
  }

  const desiredFormat = {
    hours: format.match(/h/gi)?.length || 0,
    minutes: format.match(/m/gi)?.length || 0,
    seconds: format.match(/s/gi)?.length || 0,
    fullClock: !(store.getState().config.clockHr === 12),
  };
  let meridiem: "AM" | "PM" = "AM";
  const hourFormatter = {
    format: (date: Date): string => {
      let hours = date.getHours();
      if (!desiredFormat.fullClock) {
        if (hours >= 12) {
          hours -= 12;
          meridiem = "PM";
        } else {
          if (hours === 0) hours = 12;
          meridiem = "AM";
        }
      }
      return `${hours}`.padStart(desiredFormat.hours === 1 ? 1 : 2, "0");
    },
  };

  let formattedTime = format.replace(/[hms]+/gi, (match) => {
    switch (match.charAt(0).toLowerCase()) {
      case "h":
        return hourFormatter.format(dateObject);
      case "m":
        return `${dateObject.getMinutes()}`.padStart(desiredFormat.minutes === 1 ? 1 : 2, "0");
      case "s":
        return `${dateObject.getSeconds()}`.padStart(desiredFormat.seconds === 1 ? 1 : 2, "0");
      default:
        return match;
    }
  });
  if (!desiredFormat.fullClock) {
    formattedTime += " " + meridiem;
  }
  return formattedTime.trim();
};

const dateComparer = new Intl.RelativeTimeFormat(undefined, {
  style: "short",
  numeric: "auto",
});

const msToDays = (milliseconds: number) => Math.trunc(milliseconds / (1000 * 60 * 60 * 24));
const dateDifference = (dateA: DateParam | undefined = new Date(), dateB: DateParam | undefined = new Date()): number => {
  let dateAObject: Date, dateBObject: Date;
  switch (typeof dateA) {
    case "string":
      dateAObject = new Date(new Date(Date.parse(dateA)).setHours(0, 0, 0, 0));
      break;
    case "number":
      dateAObject = new Date(new Date(dateA).setHours(0, 0, 0, 0));
      break;
    default:
      dateAObject = dateA;
  }
  switch (typeof dateB) {
    case "string":
      dateBObject = new Date(new Date(Date.parse(dateB)).setHours(0, 0, 0, 0));
      break;
    case "number":
      dateBObject = new Date(new Date(dateB).setHours(0, 0, 0, 0));
      break;
    default:
      dateBObject = dateB;
  }

  return msToDays((dateAObject as any) - (dateBObject as any));
};

function setLoginStateToken(token: string) {
  if (!+token) localStorage.removeItem(`user.auth.token`);
  localStorage.setItem(`user.auth.token`, token);
}
function getLoginStateToken() {
  return localStorage.getItem("user.auth.token");
}

function getImageUrl(avatarObject: { key: string; url: string }) {
  return (
    avatarObject?.url ||
    (avatarObject?.key
      ? //@ts-ignore
        `${import.meta.env.CC_IMAGE_BUCKET_URL}/${avatarObject.key}`
      : dummyProfileUrl)
  );
}

async function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

function convertBytes(bytes: number, to: "auto" | "KB" | "MB" | "GB" = "auto") {
  let value: number, unit: string;

  if (to === "auto") {
    // If no 'to' unit is provided, convert to the best possible unit
    if (bytes < 1024) {
      value = bytes;
      unit = "Bytes";
    } else if (bytes < 1024 * 1024) {
      value = Number((bytes / 1024).toFixed(2));
      unit = "KB";
    } else if (bytes < 1024 * 1024 * 1024) {
      value = Number((bytes / 1024 / 1024).toFixed(2));
      unit = "MB";
    } else {
      value = Number((bytes / 1024 / 1024 / 1024).toFixed(2));
      unit = "GB";
    }
    return `${value} ${unit}`;
  } else {
    unit = to;
    switch (to) {
      case "KB":
        value = Number((bytes / 1024).toFixed(2));
        break;
      case "MB":
        value = Number((bytes / 1024 / 1024).toFixed(2));
        break;
      case "GB":
        value = Number((bytes / 1024 / 1024 / 1024).toFixed(2));
        break;
      default:
        throw new Error("Invalid 'to' unit specified");
    }
    return `${value}`;
  }
}

function getAssetURL(key: string) {
  //@ts-ignore
  return `${import.meta.env.CC_ASSET_BUCKET_URL}/${key}`;
}

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.target = "_blank";
  link.href = url;
  link.download = fileName;
  link.click();
}

/**
 * @param {number} sec - Seconds to convert to hours, minutes and remaining seconds format
 * @param {string} separator - Separator string between hours, minutes and seconds. @default ':'
 * @example
 * convertToDuration(100,':') would output 01:40
 */
function convertToDuration(sec: number, separator: string = ":") {
  let seconds = 0,
    minutes = 0,
    hours = 0;
  if (sec >= 60) {
    let floatingMinutes = sec / 60;
    minutes = Math.trunc(floatingMinutes);
    seconds = Math.round((floatingMinutes - minutes) * 60);
    if (minutes >= 60) {
      let floatingHours = minutes / 60;
      hours = Math.trunc(floatingHours);
      minutes = Math.round((floatingHours - hours) * 60);
    }
  } else {
    seconds = sec;
  }

  const stringSeconds = String(seconds).padStart(2, "0"),
    stringMinutes = String(minutes).padStart(2, "0"),
    stringHours = String(hours).padStart(2, "0");

  return `${hours > 0 ? stringHours + separator : ""}${stringMinutes}${separator}${stringSeconds}`;
}
// Common Utils
export { debounce, capitalize, convertBytes, copyToClipboard, getAssetURL, getRandom0To255, getExportedVariables, getFormattedDate, getFormattedTime, dateComparer, msToDays, dateDifference, setLoginStateToken, getLoginStateToken, getImageUrl, triggerDownload, convertToDuration };

// Hooks
export { useUniqueRequest, useDebounce };
