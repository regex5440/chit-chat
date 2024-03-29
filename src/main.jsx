import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./Views/theme/variables.sass";
import "./index.sass";
import { RouterProvider } from "react-router-dom";
import router from "./library/router";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <RouterProvider router={router} />
  // </StrictMode>
);
