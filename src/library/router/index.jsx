import { createBrowserRouter, redirect } from "react-router-dom";
import { LandingPage, LoginContent, SignupContent, landingPageLoader } from "../../views/Login-Signup";
import React from "react";
import { appLoader } from "../../views/Main";
import { setLoginStateToken } from "../../utils";
import ChitChatServer from "../../client/api";

const App = React.lazy(() => import("../../views/Main"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    loader: landingPageLoader,
    children: [
      {
        path: "login",
        element: <LoginContent />,
        index: true,
      },
      {
        path: "signup",
        element: <SignupContent />,
      },
    ],
  },
  {
    path: "app",
    loader: appLoader,
    element: <App />,
    index: true,
  },
  {
    path: "/logout",
    loader: () => {
      ChitChatServer.get("/log_out");
      setLoginStateToken("");
      return redirect("/login");
    },
  },
]);

export default router;
