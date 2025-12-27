import { useState, useContext } from "react";
import { loginAccount } from "../../services/accountService.jsx";
import Back from "../Back/Back.jsx";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginAccount({ email, password });
      login(res.data.user);
      alert("Login success!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg px-8 py-10">
        <Back />

        <h2 className="mt-6 text-2xl font-bold text-center text-gray-800">
          Login
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Access your toxic comment analysis dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 border rounded-lg px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 border rounded-lg px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded-lg
              hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <div className="flex justify-between mt-6 text-sm text-gray-500">
          <span className="hover:text-blue-600 cursor-pointer">
            Forgot password?
          </span>
          <span className="hover:text-blue-600 cursor-pointer">
            Login with SMS
          </span>
        </div>

        <div className="text-center mt-8 text-sm">
          <span className="text-gray-500">New to the system?</span>{" "}
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
