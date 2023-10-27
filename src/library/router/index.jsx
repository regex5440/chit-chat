import { createBrowserRouter } from "react-router-dom";
import { LandingPage, LoginContent, SignupContent, landingPageLoader } from "../../Views/Components/Login-Signup/LoginSignup";
import React from "react";
import { appLoader } from "../../Views/Main";

const App = React.lazy(() => import("../../Views/Main"));

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
]);

export default router;
