import React, { MouseEventHandler } from "react";
import "./contact_tile.sass";
import { useDispatch, useSelector } from "react-redux";
import { updateSelectedContact, setTempConnection } from "../../../library/redux/reducers";
import { chatInfoForContactTile } from "../../../library/redux/selectors";
import { capitalize, dateComparer, dateDifference, getFormattedDate, getFormattedTime, getImageUrl } from "../../../utils";

export enum UserTileType {
  CONNECTION = "connection",
  USER = "user",
  GROUP = "group",
}

type RestProps = {
  style?: React.CSSProperties;
};

type CommonAccountProp = {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: {
    key: string;
    url: string;
  };
  TYPE: UserTileType.CONNECTION | UserTileType.GROUP | UserTileType.USER;
  deleted?: boolean;
};
type ConnectionSpecificProp = {
  unseen_messages_count: number;
  TYPE: UserTileType.CONNECTION;
};
type UserSearchSpecificProp = {
  username: string;
  TYPE: UserTileType.USER;
};

type GroupSearchSpecificProp = {
  id: string;
  name: string;
  bio: string;
  avatar: {
    key: string;
    url: string;
  };
  TYPE: UserTileType.GROUP;
  deleted?: boolean;
};
type UserTileGeneric = UserTileType.CONNECTION | UserTileType.USER | UserTileType.GROUP;

type UserSpecificProp<T> = T extends UserTileType.CONNECTION ? CommonAccountProp & ConnectionSpecificProp : T extends UserTileType.USER ? CommonAccountProp & UserSearchSpecificProp : GroupSearchSpecificProp;

const ContactTile = <T extends UserTileGeneric>(prop: UserSpecificProp<T> & RestProps) => {
  const dispatch = useDispatch();
  if (prop.TYPE === UserTileType.CONNECTION) {
    var { last_updated, authors_typing, last_message, isSelected } = useSelector(chatInfoForContactTile(prop.id));
  }

  const getProfileName = () => {
    if (prop.TYPE === UserTileType.GROUP) {
      return `${prop.name}`;
    }
    return `${prop.firstName} ${prop.lastName}`;
  };
  const getProfileStatus = () => {
    if (prop.TYPE === UserTileType.CONNECTION && prop.unseen_messages_count > 0) {
      return <span className="contact-unread-message-count">{prop.unseen_messages_count}</span>;
    }
  };
  const setSelectedContact: MouseEventHandler<HTMLDivElement> = (e) => {
    if (prop.TYPE !== UserTileType.CONNECTION) {
      dispatch(setTempConnection(prop.id));
    }
    dispatch(updateSelectedContact(prop.id));
  };

  const renderRecentActivityTime = () => {
    const dateDiff = dateDifference(last_updated);

    if (dateDiff !== 0 && dateDiff > -7) {
      return capitalize(dateComparer.format(dateDiff, "days"));
    } else if (dateDiff === 0) {
      return getFormattedTime(last_updated, "hh:mm");
    } else {
      return getFormattedDate(last_updated, "dd-mmm-yy");
    }
  };
  const typing = authors_typing?.includes(prop.id) || false;
  const getOverview = () => {
    if (prop.TYPE === UserTileType.CONNECTION) {
      if (typing) {
        return <span className="status-typing">typing...</span>;
      } else if (last_message?.type === "text") {
        return last_message?.text;
      } else if (last_message && last_message.type !== "text") {
        return (
          <em>
            Sent {last_message.type.charAt(0) === "i" ? "an" : "a"} {last_message.type}
          </em>
        );
      } else {
        return <em>Chat Deleted</em>;
      }
    } else {
      return prop.bio;
    }
  };
  return (
    <div className="contact-tile-container" data-type={prop.TYPE}>
      <div className="contact-tile-content" data-active={prop.TYPE !== UserTileType.CONNECTION ? true : isSelected || false} onClick={setSelectedContact}>
        <div className="contact-picture-container">
          <img src={getImageUrl(prop.avatar)} alt={prop.TYPE === UserTileType.GROUP ? prop.name : prop.firstName} className="profile-picture" data-dull={prop.deleted || "false"} />
        </div>
        <div className="contact-name" title={getProfileName()} data-no_data={prop.deleted}>
          {getProfileName()}
        </div>
        {prop.TYPE === UserTileType.USER && (
          <span className="contact-username" title={prop.username}>
            @{prop.username}
          </span>
        )}
        <div className="contact-message" title={"Latest message"}>
          {getOverview()}
        </div>
        {last_updated && <div className="profile-last-activity">{renderRecentActivityTime()}</div>}
        {prop.TYPE === UserTileType.CONNECTION && (
          <div className="contact-status" data-typing={typing} data-count={prop.unseen_messages_count}>
            {getProfileStatus()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactTile;
