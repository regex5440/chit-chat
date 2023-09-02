import React, { MouseEventHandler } from "react";
import "./contact_tile.sass";
import { useDispatch, useSelector } from "react-redux";
import { selectContact } from "../../../../library/redux/reducers";
import { chatInfoForContactTile } from "../../../../library/redux/selectors";
import { capitalize, dateComparer, dateDifference, getFormattedDate, getFormattedTime } from "../../../../utils";

type ContactBasicDetails = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: {
    key: string;
    url: string;
  };
};

type ContactTileProp = (ContactBasicDetails & { isConnection: true; unseen_messages_count: number }) | (ContactBasicDetails & { isConnection: false; username: string });
const ContactTile = ({ id, firstName, lastName, avatar, unseen_messages_count, username, isConnection, ...restProps }: ContactTileProp) => {
  if (isConnection) {
    var { last_updated, authors_typing, last_message, isSelected } = useSelector(chatInfoForContactTile(id));
  }
  const dispatch = useDispatch();

  const getProfileName = () => {
    return `${firstName} ${lastName}`;
  };
  const getProfileStatus = () => {
    if (unseen_messages_count > 0) {
      return <span className="contact-unread-message-count">{unseen_messages_count}</span>;
    }
  };
  const updateSelectedContact: MouseEventHandler<HTMLDivElement> = (e) => {
    dispatch(selectContact(id));
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
  const typing = authors_typing?.includes(id) || false;
  console.log({ isConnection, username });
  return (
    <div className="contact-tile-container" data-type={isConnection ? "connection" : "user"} {...restProps}>
      <div className="contact-tile-content" data-active={isSelected || false} onClick={isConnection ? updateSelectedContact : undefined}>
        <div className="contact-picture-container">
          <img src={avatar.url || (avatar.key ? `${import.meta.env.CC_IMAGE_BUCKET_URL}/${avatar.key}` : "")} alt={firstName} className="profile-picture" />
        </div>
        <div className="contact-name">{getProfileName()}</div>
        {isConnection ? <div className="contact-message">{typing ? <span className="status-typing">typing...</span> : last_message.text}</div> : <div className="contact-username">@{username}</div>}
        {last_updated && <div className="profile-last-activity">{renderRecentActivityTime()}</div>}
        {isConnection && (
          <div className="contact-status" data-typing={typing} data-count={unseen_messages_count}>
            {getProfileStatus()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactTile;
