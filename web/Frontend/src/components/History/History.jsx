import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAnalysisHistory,
  deleteAnalysis
} from "../../services/predict.service.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import Back from "../Back/Back.jsx";

export default function History() {
    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");   // ⭐ NEW
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        async function fetchData() {
        const res = await getAnalysisHistory(user.id);
        setHistory(res.data.data);
        }
        if (user) fetchData();
    }, [user.id]);

    /* ================= DELETE HANDLER ================= */
    const handleDelete = async (analysisId) => {
        const ok = window.confirm("Are you sure you want to delete this analysis?");
        if (!ok) return;

        try {
        await deleteAnalysis(analysisId, user.id);

        setHistory(prev =>
            prev.filter(item => item.id !== analysisId)
        );
        } catch (err) {
        alert("Delete failed");
        console.error(err);
        }
    };

    /* ================= FILTER ================= */
    const filteredHistory = history.filter(item =>
        item.post_url
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
        <Back />

        <h2 className="mt-5 text-2xl font-bold mb-4">
            Analysis History
        </h2>

        {/* 🔍 SEARCH BAR */}
        <input
            type="text"
            placeholder="Search by URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {filteredHistory.length === 0 && (
            <p className="text-gray-500">No analysis found</p>
        )}

        {filteredHistory.map(item => (
            <div
            key={item.id}
            className="border rounded p-4 mb-3 flex justify-between items-center"
            >
            <div className="max-w-[70%]">
                <p className="font-semibold break-all">
                {item.post_url}
                </p>
                <p className="text-sm text-gray-500">
                {new Date(item.created_at).toLocaleString()}
                </p>
            </div>

            <div className="flex gap-2">
                <button
                onClick={() => navigate(`/analysis/${item.id}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400"
                >
                View
                </button>

                <button
                onClick={() => handleDelete(item.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400"
                >
                Delete
                </button>
            </div>
            </div>
        ))}
        </div>
    );
}
