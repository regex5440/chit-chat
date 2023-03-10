import React from "react";
import { SearchChat } from "../Chat";
import './contact_list.sass';
import FlipMove from "react-flip-move";
import ContactTile from "../Chat/ContactTile";

const Contacts = () => {
    const demoContactList = [{
        firstName: 'GAPD',
        lastName: 'DesPro',
        img_url: null,
        lastMessage: 'Will see you!',
        hasNewMessage: true,
        unReadMessagesCount: 2,
        isTyping: false,
        lastActivityAt: '5:23 PM'
    }, {
        firstName: 'Jaan!',
        lastName: 'T',
        img_url: null,
        lastMessage: 'Hi, I really really really love you, so much so',
        hasNewMessage: false,
        unReadMessagesCount: 0,
        isTyping: false,
        lastActivityAt: '2:32 PM'
    }, {
        firstName: 'Jaan!',
        lastName: 'T',
        img_url: null,
        lastMessage: 'Hi, I really really really love you, so much so',
        hasNewMessage: false,
        unReadMessagesCount: 0,
        isTyping: false,
        lastActivityAt: '2:32 PM'
    }, {
        firstName: 'Jaan!',
        lastName: 'T',
        img_url: null,
        lastMessage: 'Hi, I really really really love you, so much so',
        hasNewMessage: false,
        unReadMessagesCount: 0,
        isTyping: false,
        lastActivityAt: '2:32 PM'
    }, {
        firstName: 'Jaan!',
        lastName: 'T',
        img_url: null,
        lastMessage: 'Hi, I really really really love you, so much so',
        hasNewMessage: false,
        unReadMessagesCount: 0,
        isTyping: false,
        lastActivityAt: '2:32 PM'
    }]
    const addShadow = ({ target }) => {
        if (target.scrollTop > 5) {
            target.dataset.showshadow = true
        } else {
            target.dataset.showshadow = false
        }
    }
    return <div className="contact-list-container" data-showshadow={false} onScroll={addShadow}>
        {/* <FlipMove className="flip-wrapper" style={{ color: 'red' }}> */}
        {demoContactList.map(contact => {
            return <ContactTile key={contact.firstName} {...contact} />
        })}
        {/* </FlipMove> */}
    </div>
}

const ContactList = () => {
    return <div className="contact-list-main-container">
        <SearchChat />
        <Contacts />
    </div>
}

export default ContactList