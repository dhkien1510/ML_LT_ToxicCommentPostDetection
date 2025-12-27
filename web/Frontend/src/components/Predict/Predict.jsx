import { useState } from "react";
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

  if(!user){
    navigate("/login");
  }

  const handlePredict = async () => {
    setLoading(true);

    try {
      let payload;

      // ===== URL =====
      if (inputType === "url") {
        if (!url) {
          alert("Please enter a URL");
          return;
        }

        payload = {
          type: "url",
          data: url
        };
      }

      // ===== FILE =====
      else {
        if (!file) {
          alert("Please upload a file");
          return;
        }

        const text = await file.text();
        let comments = [];

        // .txt
        if (file.name.endsWith(".txt")) {
          comments = text
            .split("\n")
            .map(c => c.trim())
            .filter(Boolean);
        }

        // .json
        else if (file.name.endsWith(".json")) {
          const json = JSON.parse(text);

          // cho phép nhiều format
          comments =
            json.comments ||
            json.data ||
            json ||
            [];
        }

        payload = {
          type: "file",
          data: { comments }
        };
      }

      const res = await predict(payload);
      setResult(res.data);

    } catch (err) {
      console.error(err);
      alert("Prediction failed");
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
      await saveAnalysis(user.id, {
        url,
        result
      });

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

            <p className="mb-2">
              <span className="font-semibold">Most hateful user:</span>{" "}
              {result.mostHateUser}
            </p>

            <p className="mb-2">
              <span className="font-semibold">Top hate words:</span>{" "}
              {Object.entries(result.topWords.hate)
                .map(([word, count]) => `${word} (${count})`)
                .join(", ")}
            </p>

            <p>
              <span className="font-semibold">Top offensive words:</span>{" "}
              {Object.entries(result.topWords.offensive)
                .map(([word, count]) => `${word} (${count})`)
                .join(", ")}
            </p>
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
