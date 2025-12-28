import { useState, useEffect } from "react";
import Back from "../Back/Back.jsx";

const LABELS = [
  { key: "clean", color: "bg-green-500" },
  { key: "offensive", color: "bg-yellow-500" },
  { key: "hate", color: "bg-red-500" }
];

export default function GuessGame() {
  const [samples, setSamples] = useState([]);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // ================= LOAD CSV =================
  useEffect(() => {
    fetch("/data.csv")
      .then(res => res.text())
      .then(text => {
        const lines = text.split("\n").slice(1);

        const labelMap = {
          "0": "clean",
          "1": "offensive",
          "2": "hate"
        };

        const data = lines
          .map(line => {
            if (!line.trim()) return null;

            const lastComma = line.lastIndexOf(",");
            if (lastComma === -1) return null;

            const free_text = line.slice(0, lastComma).trim();
            const label_id = line
              .slice(lastComma + 1)
              .trim()
              .replace(/\r$/, "");

            const label = labelMap[label_id];
            if (!label) return null;

            return {
              text: free_text.replace(/^"|"$/g, ""),
              label
            };
          })
          .filter(Boolean)
          .sort(() => Math.random() - 0.5); // shuffle

        setSamples(data);
      });
  }, []);


  if (samples.length === 0) {
    return <div className="p-10 text-center">Loading dataset...</div>;
  }

  const sample = samples[round % samples.length];

  const handleGuess = () => {
    if (!guess) return;
    setShowResult(true);
  };

  const nextRound = () => {
    setGuess(null);
    setShowResult(false);
    setRound(r => r + 1);
  };

  const isCorrect = guess === sample.label;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="absolute top-6 left-6 z-10">
        <Back />
      </div>

      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white w-full max-w-xl p-8 rounded-2xl shadow-xl text-center">

          <h1 className="text-3xl font-bold mb-6">
            🎮 Guess the Toxicity
          </h1>

          {/* COMMENT */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 text-lg italic">
            “{sample.text}”
          </div>

          {/* BUTTONS */}
          {!showResult && (
            <>
              <p className="font-semibold mb-3">
                What label do you think?
              </p>

              <div className="flex justify-center gap-4 mb-6">
                {LABELS.map(l => (
                  <button
                    key={l.key}
                    onClick={() => setGuess(l.key)}
                    className={`px-5 py-2 rounded text-white font-semibold
                      ${l.color}
                      ${guess === l.key ? "ring-4 ring-offset-2 ring-blue-400" : ""}
                    `}
                  >
                    {l.key.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGuess}
                disabled={!guess}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Guess
              </button>
            </>
          )}

          {/* RESULT */}
          {showResult && (
            <div className="mt-6">
              <h2 className={`text-2xl font-bold mb-3 ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}>
                {isCorrect ? "🎉 Correct!" : "❌ Wrong guess"}
              </h2>

              <p className="mb-4">
                True label: <b>{sample.label}</b>
              </p>

              <button
                onClick={nextRound}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg"
              >
                Next comment →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
