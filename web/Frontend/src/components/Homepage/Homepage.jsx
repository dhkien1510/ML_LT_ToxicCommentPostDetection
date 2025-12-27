import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useContext } from "react";
import { FaUser, FaSignOutAlt, FaHistory, FaGamepad } from "react-icons/fa";

export default function HomePage() {  
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center px-10 py-4 bg-white shadow">
        <h1 className="text-xl font-bold text-blue-600">
          Toxic Comment Detection
        </h1>

        {/* RIGHT HEADER */}
        {!user ? (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-6 text-gray-700">

            {/* 🔹 History */}
            <Link
              to="/history"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <FaHistory />
              <span>History</span>
            </Link>

            {/* 🎮 Guess Game */}
            <Link
              to="/guess"
              className="flex items-center gap-1 hover:text-purple-600"
            >
              <FaGamepad />
              <span>Guess Game</span>
            </Link>

            {/* User info */}
            <Link to="/account" className="flex items-center gap-2">
              <FaUser className="text-blue-600" />
              <span className="font-medium">{user.name}</span>
            </Link>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-1 text-red-500 hover:text-red-700"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>


      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold mb-6">
          Analyze Toxic Comments with AI
        </h2>

        <p className="text-gray-600 text-lg mb-10">
          Provide a post URL or upload a file to detect <b>offensive</b>,{" "}
          <b>hate</b>, and <b>clean</b> comments using our AI model.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-2">Content Analysis</h3>
            <p className="text-sm text-gray-500">
              Automatically classify comments into clean, offensive, and hate.
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-2">Advanced Insights</h3>
            <p className="text-sm text-gray-500">
              Discover most hateful users and frequently used toxic words.
            </p>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h3 className="font-semibold mb-2">Visual Reports</h3>
            <p className="text-sm text-gray-500">
              View results with pie charts and bar charts.
            </p>
          </div>
        </div>

        {/* Action button */}
        <Link
          to="/predict"
          className="inline-block px-8 py-3 bg-blue-600 text-white text-lg rounded hover:bg-blue-700"
        >
          Start Predicting
        </Link>

        {/* Extra features */}
        <div className="mt-16 text-sm text-gray-500">
          <p>✔ Save analyzed posts</p>
          <p>✔ Download analysis results</p>
          <p>✔ Access our public AI model API</p>
        </div>
      </main>
    </div>
  );
}
