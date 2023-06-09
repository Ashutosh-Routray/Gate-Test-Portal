import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { initFirebase } from "./firebaseConfig";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import App from "./App";
import Signin from "./Components/Signin/page";
import Adminlogin from "./Components/AdminPages/Adminlogin/page";
import Admin from "./Components/AdminPages/Admin/page";

initFirebase();

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <App />
      </>
    ),
    errorElement: <Navigate to="/" />,
  },
  {
    path: "/signin",
    element: (
      <>
        <Signin />
      </>
    ),
  },
  {
    path: "/admin",
    element: (
      <>
        <Adminlogin />
      </>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <>
        <Admin />
      </>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
