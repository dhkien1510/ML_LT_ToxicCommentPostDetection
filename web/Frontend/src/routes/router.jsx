import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../components/Layout/RootLayout.jsx"
import Login from "../components/Login/Login.jsx";
import Register from "../components/Register/Register.jsx";
import HomePage from "../components/Homepage/Homepage.jsx";
import Account from "../components/Account/Account.jsx";
import Predict from "../components/Predict/Predict.jsx";
import Detail from "../components/Detail/Detail.jsx";
import History from "../components/History/History.jsx";
import GuessGame from "../components/GuessGame/GuessGame.jsx";

const router = createBrowserRouter([
  // ========= ROOT =========
    {
        element: <RootLayout />,
        children: [
            // Home Page
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/register",
                element: <Register />
            },
            {
                path: "/account",
                element: <Account />
            },
            {
                path: "/predict",
                element: <Predict />
            }, 
            {
                path: "/history",
                element: <History />
            },
            {
                path: "/analysis/:analysisId",
                element: <Detail />
            },
            {
                path: "/guess",
                element:<GuessGame />
            }
        ],
    },
]);

export default router;
