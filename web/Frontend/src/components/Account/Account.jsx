import { useContext, useEffect, useState } from "react";
import Back from "../Back/Back.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import {
  updateProfile,
  changePassword,
} from "../../services/accountService.jsx";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const { user, updateUser } = useContext(AuthContext);

  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    address: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");

    if (isEditing) {
      setEditUser({
        name: user.name || "",
        email: user.email || "",
        address: user.address || "",
      });
    }
  }, [isEditing, user]);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setEditUser({
        name: user.name || "",
        email: user.email || "",
        address: user.address || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      const res = await updateProfile(user.id, editUser);
      updateUser(res.data);
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleChangePassword = async () => {
    if (!passwords.oldPassword) {
      setMessage("Please enter old password.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await changePassword(user.id, {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      setMessage("Password changed successfully!");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Change password failed");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <Back />

        {/* PAGE TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Account Settings
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your personal information and security
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500">
                Update your personal details
              </p>
            </div>

            <button
              onClick={handleToggleEdit}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition
                ${
                  isEditing
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                }`}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["name", "email", "address"].map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-sm font-medium text-gray-600 capitalize">
                  {field}
                </label>
                <input
                  name={field}
                  value={isEditing ? editUser[field] || "" : user[field] || ""}
                  onChange={handleUserChange}
                  disabled={!isEditing}
                  className={`w-full h-11 px-4 rounded-lg border text-sm transition
                    ${
                      isEditing
                        ? "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        : "bg-gray-100 border-gray-200 text-gray-600"
                    }`}
                />
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="px-7 py-3 text-white rounded-xl bg-blue-500
                          hover:bg-blue-400 transition font-semibold shadow"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* PASSWORD CARD */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Change Password
            </h2>
            <p className="text-sm text-gray-500">
              Keep your account secure
            </p>
          </div>

          <div className="space-y-5 max-w-md">
            {["oldPassword", "newPassword", "confirmPassword"].map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-sm font-medium text-gray-600">
                  {field}
                </label>
                <input
                  type="password"
                  placeholder={`Enter ${field}`}
                  value={passwords[field]}
                  onChange={(e) =>
                    setPasswords({ ...passwords, [field]: e.target.value })
                  }
                  className="w-full h-11 px-4 rounded-lg border border-gray-300
                            focus:outline-none focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={handleChangePassword}
              className="px-7 py-3  text-white rounded-xl bg-blue-500
                          hover:bg-blue-400
                         transition font-semibold shadow"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="rounded-xl px-5 py-4 text-sm font-medium
                          bg-yellow-50 text-yellow-800 border border-yellow-200">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
