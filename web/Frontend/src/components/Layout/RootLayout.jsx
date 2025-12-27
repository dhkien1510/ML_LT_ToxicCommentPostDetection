// layouts/RootLayout.jsx
import { Outlet } from "react-router-dom";
import { useContext } from "react";
import { LoadingContext } from "../../context/LoadingContext.jsx";

export default function RootLayout() {
    const { loading } = useContext(LoadingContext);

    return (
        <>
            {loading && <GlobalSpinner />}
            <Outlet />        
        </>
    );
}

function GlobalSpinner() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-gray-700 font-medium text-lg">
                    Loading...
                </p>
            </div>
        </div>
    );
}
