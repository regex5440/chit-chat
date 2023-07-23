import { createBrowserRouter } from "react-router-dom";
import { LandingPage, LoginContent, SignupContent } from "../../Layout/Components/Login-Signup/LoginSignup";
import React from "react";
import { appLoader } from "../../Layout/Main";

const App = React.lazy(() => import("../../Layout/Main"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
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
]);

export default router;
