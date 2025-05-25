import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const Prediction = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [lastPredicted, setLastPredicted] = useState("Never");

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    const storedEmail = localStorage.getItem("email");

    if (!token) {
      navigate("/login");
    } else {
      setEmail(storedEmail || "User");
    }

    setLoading(false);
  }, [navigate]);

  // Mock prediction data
  const mockPredictionData = {
    "prediction": {
      "rain_level": 0,
      "rain_score": 6.461407610913739e-05,
      "timestamp": "2025-05-20T23:23:02.429193"
    },
    "summary": {
      "humidity": {
        "25%": 49.3252,
        "50%": 49.33594,
        "75%": 49.33594,
        "count": 84.0,
        "max": 49.34766,
        "mean": 49.33195309523809,
        "min": 49.31348,
        "std": 0.010155437023951287
      },
      "light": {
        "25%": 3.0,
        "50%": 3.0,
        "75%": 3.0,
        "count": 84.0,
        "max": 3.0,
        "mean": 2.9047619047619047,
        "min": 2.0,
        "std": 0.29530656397045935
      },
      "pressure": {
        "25%": 1025.83675,
        "50%": 1025.8474999999999,
        "75%": 1025.856,
        "count": 84.0,
        "max": 1025.867,
        "mean": 1025.8451071428572,
        "min": 1025.808,
        "std": 0.01405498484409193
      },
      "rain_score": {
        "25%": 0.42621,
        "50%": 0.427784,
        "75%": 0.43181825,
        "count": 84.0,
        "max": 0.438017,
        "mean": 0.4289134642857142,
        "min": 0.420701,
        "std": 0.004029520571340177
      },
      "temperature": {
        "25%": 22.81,
        "50%": 22.82,
        "75%": 22.82,
        "count": 84.0,
        "max": 22.82,
        "mean": 22.817380952380947,
        "min": 22.81,
        "std": 0.004423117697550667
      }
    },
    "trends": {
      "humidity": -0.0010258583819980074,
      "light": -0.0450643790811908,
      "pressure": 0.0007353951307016082,
      "rain_score": 9.669357590874977e-05,
      "temperature": -0.0005613365338861092
    }
  };

  const handleGeneratePrediction = () => {
    // In a real implementation, this would fetch from your API
    setPredictionData(mockPredictionData);
    setLastPredicted(new Date().toLocaleString());
  };

  // Format trend with arrow indicator
  const formatTrend = (value) => {
    if (value > 0.001) return `↗️ ${value.toFixed(4)}`;
    else if (value < -0.001) return `↘️ ${value.toFixed(4)}`;
    else return `→ ${value.toFixed(4)}`;
  };

  // Get rain level text based on value
  const getRainLevelText = (level) => {
    switch(level) {
      case 0: return "No Rain";
      case 1: return "Light Rain";
      case 2: return "Moderate Rain";
      case 3: return "Heavy Rain";
      default: return "Unknown";
    }
  };

  // Rain level icon mapping
  const getRainLevelIcon = (level) => {
    switch(level) {
      case 0: return "☀️";
      case 1: return "🌦️";
      case 2: return "🌧️";
      case 3: return "⛈️";
      default: return "❓";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🔮 Weather Prediction</h1>
      <h2 className="text-xl mb-6">👋 Welcome, {email}!</h2>

      <button
        onClick={() => {
          localStorage.clear();
          navigate("/login");
        }}
        className="btn btn-outline btn-sm mb-6"
      >
        🚪 Logout
      </button>

      <div className="card bg-white shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Weather Forecast</h2>
          <p className="mb-4">Select parameters to generate a weather prediction:</p>
          
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Location</span>
            </label>
            <input type="text" placeholder="Enter location" className="input input-bordered w-full max-w-xs" />
          </div>
          
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Days to forecast</span>
            </label>
            <select className="select select-bordered">
              <option disabled selected>Choose timeframe</option>
              <option>1 day</option>
              <option>3 days</option>
              <option>7 days</option>
            </select>
          </div>
          
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Parameters</span>
            </label>
            <div className="flex flex-col gap-2">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Temperature</span> 
                  <input type="checkbox" className="checkbox" checked />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Humidity</span> 
                  <input type="checkbox" className="checkbox" checked />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Rainfall</span> 
                  <input type="checkbox" className="checkbox" checked />
                </label>
              </div>
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={handleGeneratePrediction}>Generate Prediction</button>
        </div>
      </div>
      
      <div className="card bg-white shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Prediction Results</h2>
          
          {predictionData ? (
            <div>
              <div className="alert shadow-lg mb-4">
                <div>
                  {getRainLevelIcon(predictionData.prediction.rain_level)}
                  <div>
                    <h3 className="font-bold">Weather Prediction</h3>
                    <div className="text-sm">
                      {getRainLevelText(predictionData.prediction.rain_level)}
                      {" • "}Rain Score: {(predictionData.prediction.rain_score * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  For: {new Date(predictionData.prediction.timestamp).toLocaleDateString()}
                </div>
              </div>
              
              <div className="divider">Statistical Summary</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Temperature</div>
                  <div className="stat-value text-primary">{predictionData.summary.temperature.mean.toFixed(1)}°C</div>
                  <div className="stat-desc">
                    Range: {predictionData.summary.temperature.min}°C to {predictionData.summary.temperature.max}°C
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.temperature)}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Humidity</div>
                  <div className="stat-value text-secondary">{predictionData.summary.humidity.mean.toFixed(1)}%</div>
                  <div className="stat-desc">
                    Range: {predictionData.summary.humidity.min}% to {predictionData.summary.humidity.max}%
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.humidity)}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Pressure</div>
                  <div className="stat-value text-accent">{predictionData.summary.pressure.mean.toFixed(2)} hPa</div>
                  <div className="stat-desc">
                    Range: {predictionData.summary.pressure.min} hPa to {predictionData.summary.pressure.max} hPa
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.pressure)}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Light</div>
                  <div className="stat-value text-info">{predictionData.summary.light.mean.toFixed(1)} lux</div>
                  <div className="stat-desc">
                    Range: {predictionData.summary.light.min} lux to {predictionData.summary.light.max} lux
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.light)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Generate a prediction to see results here</p>
          )}
        </div>
      </div>

      {/* Footer / System Status */}
      <footer className="mt-10 text-sm text-center text-gray-500">
        System Status: 🟢 Online | Last predicted: {lastPredicted}
      </footer>
    </div>
  );
};

export default Prediction; 