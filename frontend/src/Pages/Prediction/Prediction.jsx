import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const Prediction = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [lastPredicted, setLastPredicted] = useState("Never");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

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

  const handleGeneratePrediction = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Call the real prediction API
      const predictionResponse = await fetch("http://localhost:5001/api/predict", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!predictionResponse.ok) {
        throw new Error(`Prediction API error: ${predictionResponse.status}`);
      }

      const predictionResult = await predictionResponse.json();
      
      // Get analysis data for the last 24 hours
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const analyzeResponse = await fetch(
        `http://localhost:5001/api/analyze?start=${yesterday.toISOString()}&end=${now.toISOString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      let analysisResult = null;
      if (analyzeResponse.ok) {
        analysisResult = await analyzeResponse.json();
      }

      // Transform the data to match the expected format
      const transformedData = {
        prediction: {
          rain_level: predictionResult.prediction.rain_prob > 0.7 ? 3 : 
                     predictionResult.prediction.rain_prob > 0.5 ? 2 :
                     predictionResult.prediction.rain_prob > 0.3 ? 1 : 0,
          rain_score: predictionResult.prediction.rain_prob,
          timestamp: predictionResult.prediction.timestamp
        },
        summary: analysisResult ? analysisResult.summary : {
          temperature: {
            mean: predictionResult.features_used.temperature || 22.0,
            min: predictionResult.features_used.temperature || 22.0,
            max: predictionResult.features_used.temperature || 22.0,
            count: 1,
            "25%": predictionResult.features_used.temperature || 22.0,
            "50%": predictionResult.features_used.temperature || 22.0,
            "75%": predictionResult.features_used.temperature || 22.0,
            std: 0
          },
          humidity: {
            mean: predictionResult.features_used.humidity || 50.0,
            min: predictionResult.features_used.humidity || 50.0,
            max: predictionResult.features_used.humidity || 50.0,
            count: 1,
            "25%": predictionResult.features_used.humidity || 50.0,
            "50%": predictionResult.features_used.humidity || 50.0,
            "75%": predictionResult.features_used.humidity || 50.0,
            std: 0
          },
          pressure: {
            mean: predictionResult.features_used.pressure || 1013.0,
            min: predictionResult.features_used.pressure || 1013.0,
            max: predictionResult.features_used.pressure || 1013.0,
            count: 1,
            "25%": predictionResult.features_used.pressure || 1013.0,
            "50%": predictionResult.features_used.pressure || 1013.0,
            "75%": predictionResult.features_used.pressure || 1013.0,
            std: 0
          },
          light: {
            mean: 3.0,
            min: 2.0,
            max: 3.0,
            count: 1,
            "25%": 3.0,
            "50%": 3.0,
            "75%": 3.0,
            std: 0.3
          },
          rain_score: {
            mean: predictionResult.prediction.rain_prob,
            min: predictionResult.prediction.rain_prob,
            max: predictionResult.prediction.rain_prob,
            count: 1,
            "25%": predictionResult.prediction.rain_prob,
            "50%": predictionResult.prediction.rain_prob,
            "75%": predictionResult.prediction.rain_prob,
            std: 0
          }
        },
        trends: analysisResult ? analysisResult.trends : {
          temperature: 0,
          humidity: 0,
          pressure: 0,
          light: 0,
          rain_score: 0
        }
      };

      setPredictionData(transformedData);
      setLastPredicted(new Date().toLocaleString());
      
    } catch (err) {
      console.error("Error generating prediction:", err);
      setError(`Failed to generate prediction: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
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
          <p className="mb-4">Generate a weather prediction based on recent sensor data:</p>
          
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Data Source</span>
            </label>
            <div className="text-sm text-gray-600">
              Using last 5 hours of sensor data for prediction
            </div>
          </div>
          
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Prediction Model</span>
            </label>
            <div className="text-sm text-gray-600">
              AI Rain Classifier (Temperature, Humidity, Pressure)
            </div>
          </div>
          
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Analysis Period</span>
            </label>
            <div className="text-sm text-gray-600">
              Last 24 hours statistical summary
            </div>
          </div>
          
          {error && (
            <div className="alert alert-error mb-4">
              <div>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <button 
            className={`btn btn-primary ${isGenerating ? 'loading' : ''}`} 
            onClick={handleGeneratePrediction}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Prediction'}
          </button>
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
                      {" • "}Rain Probability: {(predictionData.prediction.rain_score * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Generated: {new Date(predictionData.prediction.timestamp).toLocaleString()}
                </div>
              </div>
              
              <div className="divider">Statistical Summary</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Temperature</div>
                  <div className="stat-value text-primary">{predictionData.summary.temperature.mean.toFixed(1)}°C</div>
                  <div className="stat-desc">
                    Range: {predictionData.summary.temperature.min.toFixed(1)}°C to {predictionData.summary.temperature.max.toFixed(1)}°C
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.temperature)}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Humidity</div>
                  <div className="stat-value text-secondary">{predictionData.summary.humidity.mean.toFixed(1)}%</div>
                  <div className="stat-desc">
                    Range: {predictionData.summary.humidity.min.toFixed(1)}% to {predictionData.summary.humidity.max.toFixed(1)}%
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.humidity)}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Pressure</div>
                  <div className="stat-value text-accent">{predictionData.summary.pressure.mean.toFixed(2)} hPa</div>
                  <div className="stat-desc">
                    Range: {predictionData.summary.pressure.min.toFixed(2)} hPa to {predictionData.summary.pressure.max.toFixed(2)} hPa
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.pressure)}
                  </div>
                </div>
                
                <div className="stat bg-base-100 rounded-box">
                  <div className="stat-title">Rain Score</div>
                  <div className="stat-value text-info">{(predictionData.summary.rain_score.mean * 100).toFixed(2)}%</div>
                  <div className="stat-desc">
                    Range: {(predictionData.summary.rain_score.min * 100).toFixed(2)}% to {(predictionData.summary.rain_score.max * 100).toFixed(2)}%
                  </div>
                  <div className="stat-desc">
                    Trend: {formatTrend(predictionData.trends.rain_score)}
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