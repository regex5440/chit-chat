import React from 'react'
import { getRandom0To255 } from '../../../../utils';
import './chat_window.sass';

const NoChatMessage = () => (<div className='no-chat-message-container'>
    <div className='no-chat-content'>
        <h2>Nothing to show here...</h2>
        <p>👈There, chit-chat starts from there</p>
    </div>
</div>)

const ChatArea = () => {
    const initialName = 'JT'
    const name = 'Jahanavi Tripathi'
    const renderProfileStatus = () => {
        return 'Online'
    }

    const renderProfileDetails = () => (
        <div className='profile-container'>
            <div className='profile-picture-container'>
                <span className="profile-picture" style={{ backgroundColor: `rgba(${getRandom0To255()}, ${getRandom0To255()}, ${getRandom0To255()},0.5)` }}>{initialName}</span>
            </div>
            <div className='profile-details'>
                <div className='profile-name'>{name}</div>
                <div className='profile-status'>{renderProfileStatus()}</div>
            </div>
        </div>
    )

    return <div className='chat-area'>
        <header className='chat-area__header-container'>
            <div className='chat-area__header-content'>
                {renderProfileDetails()}
            </div>
        </header>
    </div>
}

const ChatWindow = () => {
    const selectedContact = true


    return <div className='chat-window-main-container'>
        {selectedContact ? <ChatArea /> : <NoChatMessage />}
    </div>
}

export default ChatWindow