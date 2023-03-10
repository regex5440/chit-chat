import React from "react";
import { getRandom0To255 } from "../../../../utils";
import './contact_tile.sass';

const ContactTile = ({ firstName, lastName, dp_url, hasNewMessage, lastMessage, isTyping, lastActivityAt, unReadMessagesCount }) => {
    const getProfilePicture = () => {
        if (dp_url) {
            return (<img src={dp_url} alt={name} className='profile-picture' />)
        }
        const initialName = firstName[0] + lastName[0];
        return <span className="profile-picture" style={{ backgroundColor: `rgba(${getRandom0To255()}, ${getRandom0To255()}, ${getRandom0To255()},0.5)` }}>{initialName}</span>
    }
    const getProfileName = () => {
        return `${firstName} ${lastName}`;
    }
    const getProfileStatus = () => {
        if (hasNewMessage) {
            return <span className="contact-unread-message-count">{unReadMessagesCount}</span>
        }
    }

    return <div className="contact-tile-container">
        <div className="contact-tile-content" data-active={false}>
            <div className="contact-picture-container">
                {getProfilePicture()}
            </div>
            <div className="contact-name">{getProfileName()}</div>
            <div className="contact-message">{isTyping ? (<span className="status-typing">typing...</span>) : lastMessage}</div>
            <div className="profile-last-activity">{lastActivityAt}</div>
            <div className="contact-status" data-typing={isTyping} data-count={unReadMessagesCount}>{getProfileStatus()}</div>
        </div>
    </div>
}

export default ContactTile;