// pages/AnalysisHistory.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalysisHistory } from "../../services/predict.service.jsx"
import { AuthContext } from "../../context/AuthContext.jsx";
import { useContext } from "react";
import Back from "../Back/Back.jsx";

export default function History() {
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        async function fetchData() {
            const res = await getAnalysisHistory(user.id);    
            setHistory(res.data.data);
        }
        if(user) fetchData();
        
    }, [user.id]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
        
        <Back />
        
        <h2 className="mt-5 text-2xl font-bold mb-4">Analysis History</h2>

        {history.length === 0 && (
            <p className="text-gray-500">No analysis found</p>
        )}

        {history.map(item => (
            <div
            key={item.id}
            className="border rounded p-4 mb-3 flex justify-between items-center"
            >
            <div>
                <p className="font-semibold">{item.post_url}</p>
                <p className="text-sm text-gray-500">
                {new Date(item.created_at).toLocaleString()}
                </p>
            </div>

            <button
                onClick={() => navigate(`/analysis/${item.id}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:cursor-pointer hover:bg-blue-400"
            >
                View details
            </button>
            </div>
        ))}
        </div>
    );
}
