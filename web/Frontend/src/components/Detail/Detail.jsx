// pages/AnalysisDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAnalysisDetail } from "../../services/predict.service.jsx";
import Back from "../Back/Back.jsx";

export default function Detail() {
    const { analysisId } = useParams();
    const [data, setData] = useState(null);
    const [filterLabel, setFilterLabel] = useState("all");

    useEffect(() => {
        async function fetchDetail() {
            const res = await getAnalysisDetail(analysisId);
            setData(res.data.data);
        }
        fetchDetail();
    }, [analysisId]);

    // ✅ CHECK TRƯỚC
    if (!data) return <p className="p-6">Loading...</p>;

    // ✅ SAU KHI CÓ DATA MỚI DESTRUCTURE
    const { post_url, summary, top_words, raw_results } = data;

    const filteredResults =
        filterLabel === "all"
            ? raw_results
            : raw_results.filter(r => r.label === filterLabel);

    return (
        <div className="p-6 max-w-4xl mx-auto">
        
        <Back to="/history" />

        <h2 className="mt-5 text-2xl font-bold mb-4">Analysis Detail</h2>

        <p className="mb-2">
            <span className="font-semibold">Post URL:</span>{" "}
            <a
            href={post_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
            >
            {post_url}
            </a>
        </p>

        {/* SUMMARY */}
        <div className="mb-6">
            <h3 className="font-semibold mb-2">Summary</h3>
            <ul className="list-disc pl-5">
            <li>Clean: {summary.clean}%</li>
            <li>Hate: {summary.hate}%</li>
            <li>Offensive: {summary.offensive}%</li>
            </ul>
        </div>

        {/* TOP WORDS */}
        <div className="mb-6">
            <h3 className="font-semibold">Top hate words</h3>
            <p className="text-gray-700">
            {top_words.hate.length
                ? top_words.hate.join(", ")
                : "None"}
            </p>

            <h3 className="font-semibold mt-3">Top offensive words</h3>
            <p className="text-gray-700">
            {top_words.offensive.length
                ? top_words.offensive.join(", ")
                : "None"}
            </p>
        </div>


        {/* FILTER */}
        <div className="flex gap-3 mb-4">
            <button
                onClick={() => setFilterLabel("all")}
                className={`px-4 py-1 rounded border ${
                filterLabel === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-white"
                }`}
            >
                All ({raw_results.length})
            </button>

            <button
                onClick={() => setFilterLabel("clean")}
                className={`px-4 py-1 rounded border ${
                filterLabel === "clean"
                    ? "bg-green-600 text-white"
                    : "bg-white"
                }`}
            >
                Clean
            </button>

            <button
                onClick={() => setFilterLabel("hate")}
                className={`px-4 py-1 rounded border ${
                filterLabel === "hate"
                    ? "bg-red-600 text-white"
                    : "bg-white"
                }`}
            >
                Hate
            </button>

            <button
                onClick={() => setFilterLabel("offensive")}
                className={`px-4 py-1 rounded border ${
                filterLabel === "offensive"
                    ? "bg-yellow-500 text-white"
                    : "bg-white"
                }`}
            >
                Offensive
            </button>
        </div>

        {/* COMMENTS */}
        <div>
            <h3 className="font-semibold mb-2">All comments result</h3>
            <ul className="space-y-2">
                {filteredResults.length === 0 && (
                    <li className="text-gray-500 text-sm">
                    No comments found for this filter
                    </li>
                )}

                {filteredResults.map((r, idx) => (
                    <li
                    key={idx}
                    className="border rounded p-3 text-sm"
                    >
                    <p className="mb-1">{r.text}</p>

                    <p className="text-gray-500">
                        Label:{" "}
                        <span
                        className={`font-semibold ${
                            r.label === "clean"
                            ? "text-green-600"
                            : r.label === "hate"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                        >
                        {r.label}
                        </span>
                        {" | "}
                        Confidence: {(r.confidence * 100).toFixed(2)}%
                    </p>
                    </li>
                ))}
                </ul>
        </div>
        </div>
    );
}
