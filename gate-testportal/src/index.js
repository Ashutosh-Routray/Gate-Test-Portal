import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { initFirebase } from "./firebaseConfig";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import App from './App';
import Signin from './Components/Signin/page';
import Adminlogin from './Components/Adminlogin/page';
import QuestionEditor from './Components/QuestionEditor/page';
import Test from './Test';

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
        <QuestionEditor />
      </>
    ),
  },
  {
    path: "/test",
    element: (
      <>
        <Test />
      </>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RouterProvider router={router} />);