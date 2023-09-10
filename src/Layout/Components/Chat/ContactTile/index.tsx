import React, { MouseEventHandler } from "react";
import "./contact_tile.sass";
import { useDispatch, useSelector } from "react-redux";
import { selectContact, setTempConnection } from "../../../../library/redux/reducers";
import { chatInfoForContactTile } from "../../../../library/redux/selectors";
import { capitalize, dateComparer, dateDifference, getFormattedDate, getFormattedTime } from "../../../../utils";

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
};
type UserTileGeneric = UserTileType.CONNECTION | UserTileType.USER | UserTileType.GROUP;

type UserSpecificProp<T> = T extends UserTileType.CONNECTION ? CommonAccountProp & ConnectionSpecificProp : T extends UserTileType.USER ? CommonAccountProp & UserSearchSpecificProp : GroupSearchSpecificProp;

const ContactTile = <T extends UserTileGeneric>(prop: RestProps & UserSpecificProp<T>) => {
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
    if (prop.unseen_messages_count > 0) {
      return <span className="contact-unread-message-count">{prop.unseen_messages_count}</span>;
    }
  };
  const updateSelectedContact: MouseEventHandler<HTMLDivElement> = (e) => {
    if (prop.TYPE !== UserTileType.CONNECTION) {
      dispatch(setTempConnection(prop.id));
    }
    dispatch(selectContact(prop.id));
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

  return (
    <div className="contact-tile-container" data-type={prop.TYPE}>
      <div className="contact-tile-content" data-active={prop.TYPE !== UserTileType.CONNECTION ? true : isSelected || false} onClick={updateSelectedContact}>
        <div className="contact-picture-container">
          <img src={prop.avatar.url || (prop.avatar.key ? `${import.meta.env.CC_IMAGE_BUCKET_URL}/${prop.avatar.key}` : "")} alt={prop.firstName} className="profile-picture" />
        </div>
        <div className="contact-name">{getProfileName()}</div>
        {prop.TYPE === UserTileType.USER && <span className="contact-username">@{prop.username}</span>}
        <div className="contact-message">{prop.TYPE === UserTileType.CONNECTION ? typing ? <span className="status-typing">typing...</span> : last_message.text : prop.bio}</div>
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
