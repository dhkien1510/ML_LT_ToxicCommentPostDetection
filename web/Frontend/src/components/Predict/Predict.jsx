import { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import Back from "../Back/Back";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {predict, saveAnalysis} from "../../services/predict.service.jsx"

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function Predict() {
  const [inputType, setInputType] = useState("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handlePredict = async () => {
    setLoading(true);

    try {
      const formData = new FormData();

      if (inputType === "url") {
        if (!url) {
          alert("Please enter a URL");
          return;
        }

        formData.append("type", "url");
        formData.append("url", url);
      } else {
        if (!file) {
          alert("Please upload a file");
          return;
        }

        formData.append("type", "file");
        formData.append("file", file); // 🔥 send raw file
      }

      const res = await predict(formData);
      setResult(res.data);

    } catch (err) {
      console.error(err);
      alert("Prediction failed ❌");
    } finally {
      setLoading(false);
    }
  };


  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_result.json";
    a.click();
  };

  const handleSaveAnalysis = async () => {
    try {
      if (inputType === "url") {
        await saveAnalysis(user.id, {
          url: url,
          result: result
        });
      } else {
        await saveAnalysis(user.id, {
          url: file.name,
          result: result
        });
      }

      alert("Analysis saved successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Failed to save analysis ❌");
    }
  };

  const pieData = result && {
    labels: ["Offensive", "Hate", "Clean"],
    datasets: [
      {
        data: [
          result.summary.offensive,
          result.summary.hate,
          result.summary.clean
        ],
        backgroundColor: ["#f59e0b", "#ef4444", "#22c55e"]
      }
    ]
  };

  const labels = result
  ? [...Object.keys(result.topWords.hate), ...Object.keys(result.topWords.offensive)]
  : [];

  const dataValues = result
    ? [...Object.values(result.topWords.hate), ...Object.values(result.topWords.offensive)]
    : [];

  const barData = result && {
    labels,
    datasets: [
      {
        label: "Word Frequency",
        data: dataValues,
        backgroundColor: "#3b82f6"
      }
    ]
  };

  const results = result?.results || [];

  const confidences = results.map(r => r.confidence);

  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

  const minConfidence =
    confidences.length > 0 ? Math.min(...confidences) : 0;

  const maxConfidence =
    confidences.length > 0 ? Math.max(...confidences) : 0;

  const lowConfidence = results.filter(r => r.confidence < 0.9);

  const emojiRegex = /[\u{1F300}-\u{1FAFF}]/gu;

  const emojiStats = results.map(r => ({
    text: r.text,
    emojiCount: (r.text.match(emojiRegex) || []).length
  }));

  const avgEmoji =
    emojiStats.length > 0
      ? emojiStats.reduce((a, b) => a + b.emojiCount, 0) / emojiStats.length
      : 0;


  const lengths = results.map(r => r.text.length);

  const avgLength =
    lengths.length > 0
      ? lengths.reduce((a, b) => a + b, 0) / lengths.length
      : 0;

  const longest =
    lengths.length > 0 ? Math.max(...lengths) : 0;


  const summary = result?.summary;

  const verdict =
    summary && summary.hate === 0 && summary.offensive === 0
      ? "Very positive discussion"
      : "Potentially toxic discussion";



  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Back />

      <h1 className="mt-5 text-3xl font-bold mb-6">
        Comment Toxicity Prediction
      </h1>

      {/* INPUT CARD */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Input Source</h2>

        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={inputType === "url"}
              onChange={() => setInputType("url")}
            />
            Article URL
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={inputType === "file"}
              onChange={() => setInputType("file")}
            />
            Upload File
          </label>
        </div>

        {inputType === "url" ? (
          <input
            type="text"
            placeholder="https://example.com/post"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <input
            type="file"
            accept=".txt,.json"
            className="block"
            onChange={(e) => setFile(e.target.files[0])}
          />
        )}

        <button
          onClick={handlePredict}
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          {loading ? "Analyzing..." : "Run Prediction"}
        </button>
      </div>

      {/* RESULT */}
      {result && (
        <>
          {/* SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-5">
              <p className="text-sm text-gray-500">Offensive</p>
              <p className="text-3xl font-bold">
                {result.summary.offensive}%
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-5">
              <p className="text-sm text-gray-500">Hate</p>
              <p className="text-3xl font-bold">
                {result.summary.hate}%
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-5">
              <p className="text-sm text-gray-500">Clean</p>
              <p className="text-3xl font-bold">
                {result.summary.clean}%
              </p>
            </div>
          </div>

          {/* ANALYSIS */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Deep Analysis
            </h2>

            <span className="font-semibold">Most hate and offensive words:</span>
            <div className="mt-4 overflow-x-auto">
              <table className="border border-gray-300 rounded-lg w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">
                      Category
                    </th>
                    {Object.keys(result.topWords.hate).map((word) => (
                      <th
                        key={word}
                        className="px-4 py-2 text-center font-medium"
                      >
                        {word}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-semibold text-red-600">
                      Hate
                    </td>
                    {Object.values(result.topWords.hate).map((count, idx) => (
                      <td
                        key={idx}
                        className="px-4 py-2 text-center"
                      >
                        {count}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-t">
                    <td className="px-4 py-2 font-semibold text-orange-600">
                      Offensive
                    </td>
                    {Object.values(result.topWords.offensive).map((count, idx) => (
                      <td
                        key={idx}
                        className="px-4 py-2 text-center"
                      >
                        {count}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold mb-4">Toxicity Distribution</h3>
              <Pie data={pieData} />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold mb-4">Top Keywords</h3>
              <Bar data={barData} />
            </div>
          </div>

          {/* CONFIDENCE */}
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">📊 Confidence Analysis</h3>

            <p>Average confidence: {(avgConfidence * 100).toFixed(2)}%</p>
            <p>Highest confidence: {(maxConfidence * 100).toFixed(2)}%</p>
            <p>Lowest confidence: {(minConfidence * 100).toFixed(2)}%</p>

            {lowConfidence.length > 0 && (
              <p className="text-yellow-600 mt-2">
                ⚠ {lowConfidence.length} comments have low confidence
              </p>
            )}
          </div>

            {/* EMOJI */}
            <div className="mt-6 p-4 bg-pink-50 rounded">
              <h3 className="font-bold mb-2">😊 Emoji Usage</h3>
              <p>Average emojis per comment: {avgEmoji.toFixed(2)}</p>
            </div>

            {/* LENGTH */}
            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-bold mb-2">📏 Comment Length</h3>
              <p>Average length: {avgLength.toFixed(1)} characters</p>
              <p>Longest comment: {longest} characters</p>
            </div>

            {/* VERDICT */}
            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold">
                Overall Verdict
              </h2>
              <p className="mt-2 text-lg text-green-600">
                {verdict}
              </p>
            </div>

            {/* ACTIONS */}
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg hover:cursor-pointer"
            >
              Download Result
            </button>

            <button
              onClick={handleSaveAnalysis}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg hover:cursor-pointer">
              Save Analysis
            </button>
          </div>
        </>
      )}
    </div>
  );
}
