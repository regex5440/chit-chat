import React from "react";
import ProfileTab from "../Components/Profile";
import ContactList from "../Components/Contacts/ContactList";
import StoriesContainer from "../Components/Story";
import { ChatWindow } from "../Components/Chat";
import "./app.sass";
import store from "../../library/redux/store";
import { Provider } from "react-redux";
import { getMyProfile } from "../../library/redux/reducers";
import { redirect } from "react-router-dom";
import { setAPIHeader } from "../../client/api";
import { getLoginStateToken, setLoginStateToken } from "../../utils";
import { SocketComponent } from "../../library/socket.io/socket";

export const appLoader = async () => {
  const token = getLoginStateToken();
  if (!token) {
    return redirect("/login");
  }
  setAPIHeader(token);
  try {
    const me = await store.dispatch(getMyProfile()).unwrap();
    if (me) {
      return true;
    }
  } catch (e) {
    console.log("UserDataLoadFailed:", e);
    setLoginStateToken("");
    return redirect("/login");
  }
};

const App = () => {
  return (
    <Provider store={store}>
      <SocketComponent />
      <div className="app-container">
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
