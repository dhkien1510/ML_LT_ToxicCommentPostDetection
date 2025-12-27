import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes/router.jsx";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import LoadingProvider from "./context/LoadingContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <LoadingProvider>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </LoadingProvider>
    </StrictMode>
);