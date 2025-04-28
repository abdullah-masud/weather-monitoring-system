import React from "react";

const Dashboard = () => {
  // Simulated data object (can be replaced with real API data later)
  const data = {
    temperature: "24°C",
    humidity: "60%",
    airQuality: "Good (45 AQI)",
    rainfall: "5 mm",
    uvIntensity: "Moderate (4)",
  };

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🌦️ Smart Weather Dashboard</h1>

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
