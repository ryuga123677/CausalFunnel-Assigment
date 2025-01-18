import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom"; // For navigation

export const StartPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Save the email in localStorage
    localStorage.setItem("userEmail", email);
    navigate("/quiz");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="start-page-container p-6 max-w-md w-full bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome to the Quiz App</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xl mb-2">
              Enter your Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-3 border rounded-md"
              placeholder="example@example.com"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-md"
          >
            Start Quiz
          </button>
        </form>
      </div>
    </div>
  );
};
