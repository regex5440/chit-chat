import React, { useEffect } from "react";
import ProfileTab from "../Components/Profile";
import ContactList from "../Components/Contacts/ContactList";
import StoriesContainer from "../Components/Story";
import { ChatWindow } from "../Components/Chat";
import "./app.sass";
import store from "../../library/redux/store";
import { Provider } from "react-redux";
import { getConnections, getMyProfile } from "../../library/redux/reducers";
import { SocketComponent } from "../../library/socket.io/socket";
import { redirect } from "react-router-dom";
import { setAPIHeader } from "../../client/api";
import { getLoginStateToken } from "../../utils";

export const appLoader = () => {
  const token = getLoginStateToken();
  if (!token) {
    return redirect("/login");
  }
  setAPIHeader(token);
  return true;
};

const App = () => {
  useEffect(() => {
    async function getInitialData() {
      store.dispatch(getMyProfile());
      store.dispatch(getConnections());
    }
    getInitialData();
  }, []);
  return (
    <Provider store={store}>
      <SocketComponent />
      <div className="app-container">
        <div className="app-container__background"></div>
        <div className="app-container__app-window">
          <div className="story-container">
            <StoriesContainer />
          </div>
          <div className="profile-container">
            <ProfileTab />
          </div>
          <div className="chat-list">
            <ContactList />
          </div>
          <div className="chat-window">
            <ChatWindow />
          </div>
        </div>
      </div>
    </Provider>
  );
};

export default App;
