import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Home from "./Pages/Home/Home.jsx";
import Login from "./Pages/Login/Login.jsx";
import Dashboard from "./Pages/Dashboard/Dashboard.jsx";
import Profile from "./Pages/Profile/Profile.jsx";
import Signup from "./Pages/Login/Signup.jsx";

// Create the router
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Main layout
    children: [
      { index: true, element: <Home /> }, // default path "/"
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <Profile /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },
]);

// Render the app
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
