import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-base-200 min-h-screen">
      {/* Hero Section with Tech + Nature Background */}
      <div
        className="hero min-h-screen"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1503264116251-35a269479413?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="hero-overlay bg-opacity-60"></div>
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">
              Smart Weather Monitoring System
            </h1>
            <p className="py-6">
              Real-time weather insights powered by IoT sensors. Stay updated
              with accurate data on temperature, humidity, rainfall, and more.
            </p>
            <Link to="/dashboard">
              <button className="btn btn-secondary">Go to Dashboard</button>
            </Link>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="p-10 text-center">
        <h2 className="text-3xl font-bold mb-4">About the Project</h2>
        <p className="max-w-2xl mx-auto">
          This Smart Weather Monitoring System uses advanced IoT sensors to
          track and display real-time environmental data. Designed for smart
          cities and eco-conscious planning, our system enhances decision-making
          through live data visualization.
        </p>
      </div>

      {/* Features Section */}
      <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="card-body">
            <h2 className="card-title">🌦️ Real-Time Data</h2>
            <p>Get instant updates on weather conditions as they happen.</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="card-body">
            <h2 className="card-title">📡 Sensor Coverage</h2>
            <p>
              Monitors temperature, humidity, rainfall, UV intensity, and air
              quality.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="card-body">
            <h2 className="card-title">📊 Data-Driven Insights</h2>
            <p>
              Use historical data and trends for smarter decisions in planning.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats shadow m-10">
        <div className="stat">
          <div className="stat-title">Sensors Integrated</div>
          <div className="stat-value">5+</div>
          <div className="stat-desc">
            Temperature, Humidity, Rainfall, UV, Air Quality
          </div>
        </div>

        <div className="stat">
          <div className="stat-title">Update Frequency</div>
          <div className="stat-value">Real-time</div>
          <div className="stat-desc">Every 5 seconds</div>
        </div>

        <div className="stat">
          <div className="stat-title">System Uptime</div>
          <div className="stat-value">99.9%</div>
          <div className="stat-desc">Reliable Performance</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
