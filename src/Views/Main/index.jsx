import React, { useEffect, useRef } from "react";
import ProfileTab from "../../Components/Profile";
import ContactList from "../../Components/Contacts/ContactList";
import StoriesContainer from "../../Components/Story";
import { ChatWindow } from "../../Components/Chat";
import "./app.sass";
import store from "../../library/redux/store";
import { Provider } from "react-redux";
import { getMyProfile } from "../../library/redux/reducers";
import { redirect } from "react-router-dom";
import { setAPIHeader } from "../../client/api";
import { getLoginStateToken, setLoginStateToken } from "../../utils";
import { SocketComponent } from "../../library/socket.io/socket";
import { MainWindow } from "../../Context/layoutFunctions";

export const appLoader = async () => {
  const token = getLoginStateToken();
  if (!token) {
    return redirect("/login");
  }
  setAPIHeader(token);
  try {
    const me = await store.dispatch(getMyProfile()).unwrap();
    if (me) {
      document.title = "Chit Chat - Messaging app";
      return true;
    }
  } catch (e) {
    console.log("UserDataLoadFailed:", e);
    setLoginStateToken("");
    return redirect("/login");
  }
};

const App = () => {
  const mainApp = useRef(null);

  const scrollTo = (position) => {
    if (position === "start") {
      mainApp.current?.scrollTo(0, 0);
    } else if (position === "end") {
      mainApp.current?.scrollTo(mainApp.current.scrollWidth, 0);
    }
  };
  return (
    <Provider store={store}>
      <SocketComponent />
      <div className="app-container" ref={mainApp}>
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
            <MainWindow.Provider value={scrollTo}>
              <ChatWindow />
            </MainWindow.Provider>
          </div>
        </div>
      </div>
    </Provider>
  );
};

export default App;
