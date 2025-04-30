import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router";

const Dashboard = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get("token");
    const queryEmail = params.get("email");

    if (queryToken && queryEmail) {
      localStorage.setItem("jwt", queryToken);
      localStorage.setItem("email", queryEmail);
      window.history.replaceState({}, document.title, "/dashboard");
    }

    const token = localStorage.getItem("jwt");
    const storedEmail = localStorage.getItem("email");

    if (!token) {
      navigate("/login");
    } else {
      setEmail(storedEmail || "User");
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:5000/api/data")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error("Failed to fetch data:", err));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
      <div className="p-6 bg-base-200 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">🌦️ Smart Weather Dashboard</h1>
        <h2 className="text-xl mb-6">👋 Welcome, {email}!</h2>

        <button
            onClick={() => {
              localStorage.clear();     // or just remove specific keys
              navigate("/login");
            }}
            className="btn btn-outline btn-sm mb-6"
        >
          🚪 Logout
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Temperature Card */}
          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">🌡️ Temperature</h2>
              <p>{data.temperature}</p>
            </div>
          </div>

          {/* Humidity Card */}
          <div className="card bg-secondary text-secondary-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">💧 Humidity</h2>
              <p>{data.humidity}</p>
            </div>
          </div>

          {/* Air Quality Card */}
          <div className="card bg-accent text-accent-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">🌬️ Air Quality</h2>
              <p>{data.airQuality}</p>
            </div>
          </div>

          {/* Rainfall Card */}
          <div className="card bg-neutral text-neutral-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">🌧️ Rainfall</h2>
              <p>{data.rainfall}</p>
            </div>
          </div>

          {/* UV Intensity Card */}
          <div className="card bg-warning text-warning-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">☀️ UV Intensity</h2>
              <p>{data.uvIntensity}</p>
            </div>
          </div>
        </div>

        {/* Optional: Historical Data Placeholder */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">📊 Historical Data</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            <p>Charts coming soon...</p>
          </div>
        </div>

        {/* Footer / System Status */}
        <footer className="mt-10 text-sm text-center text-gray-500">
          Last updated: Just now | System Status: 🟢 Online
        </footer>
      </div>
  );
};

export default Dashboard;
