import { useState } from "react";
import { registerAccount } from "../../services/accountService.jsx";
import { Link } from "react-router-dom";
import Back from "../Back/Back.jsx";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerAccount(form);
      alert("Register success!");
    } catch (err) {
      alert(err.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg px-8 py-10">
        <Back />

        <h2 className="mt-6 text-2xl font-bold text-center text-gray-800">
          Register
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Create an account to save and manage analyses
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="name"
            placeholder="Full name"
            onChange={handleChange}
            className="w-full h-12 border rounded-lg px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full h-12 border rounded-lg px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full h-12 border rounded-lg px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="address"
            placeholder="Address"
            onChange={handleChange}
            className="w-full h-12 border rounded-lg px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded-lg
              hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        <div className="text-center mt-8 text-sm">
          <span className="text-gray-500">Already have an account?</span>{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
