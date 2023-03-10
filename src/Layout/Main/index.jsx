import React from "react";
import ContactList from "../Components/Contacts/ContactList";
import StoriesContainer from "../Components/Story";
import { ChatWindow } from "../Components/Chat"
import './app.sass';

const App = () => {
    return (
        <div className="app-container">
            <div className="app-container__background"></div>
            <div className="app-container__app-window">
                <div className="story-container"><StoriesContainer /></div>
                <div className="profile-container">Profile</div>
                <div className="chat-list"><ContactList /></div>
                <div className="chat-window"><ChatWindow /></div>
            </div>
        </div>
    )
}

export default App;