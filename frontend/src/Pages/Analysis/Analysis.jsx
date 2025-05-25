import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const Analysis = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("Never");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

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

  // Mock analysis data
  const mockAnalysisData = {
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

  const loadAnalysisData = () => {
    // Connect to the backend API with the date range
    setAnalysisData(null); // Clear previous data while loading
    
    fetch(`/api/analyze?start=${dateRange.startDate}T00:00:00&end=${dateRange.endDate}T23:59:59`)
      .then(res => res.json())
      .then(data => {
        console.log("Received analysis data:", data);
        setAnalysisData(data);
        setLastUpdated(new Date().toLocaleString());
      })
      .catch(err => {
        console.error("Failed to fetch analysis data:", err);
        // Fallback to mock data in case of error
        setAnalysisData(mockAnalysisData);
        setLastUpdated(new Date().toLocaleString() + " (mock data)");
      });
  };

  useEffect(() => {
    // Load analysis data on component mount
    loadAnalysisData();
  }, []);

  // Handle date changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply date filter
  const applyDateFilter = () => {
    loadAnalysisData();
  };

  // Format trend with arrow indicator
  const formatTrend = (value) => {
    if (value > 0.001) return `↗️ ${value.toFixed(4)}`;
    else if (value < -0.001) return `↘️ ${value.toFixed(4)}`;
    else return `→ ${value.toFixed(4)}`;
  };

  // Quick date range options
  const predefinedRanges = [
    { label: "Today", days: 0 },
    { label: "Yesterday", days: 1 },
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "This Month", days: "month" },
  ];

  // Set predefined date range
  const setPredefinedRange = (option) => {
    const endDate = new Date().toISOString().split('T')[0];
    let startDate;
    
    if (option.days === "month") {
      // First day of current month
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else {
      // X days ago
      startDate = new Date(Date.now() - option.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // If it's just for one day (today or yesterday), make start and end the same
      if (option.days === 0) {
        // Today only
        startDate = endDate;
      } else if (option.days === 1) {
        // Yesterday only
        startDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        // Set end date to be the same as start date for "Yesterday"
        setDateRange({ startDate, endDate: startDate });
        return;
      }
    }
    
    setDateRange({ startDate, endDate });
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
      <h1 className="text-3xl font-bold mb-6">📊 Weather Data Analysis</h1>
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

      {/* Date Selection Card */}
      <div className="card bg-white shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Date Selection</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {predefinedRanges.map((range, index) => (
              <button 
                key={index} 
                className="btn btn-sm btn-outline"
                onClick={() => setPredefinedRange(range)}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input 
                type="date" 
                name="startDate" 
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="input input-bordered" 
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input 
                type="date" 
                name="endDate" 
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="input input-bordered" 
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Apply Filter</span>
              </label>
              <button 
                className="btn btn-primary" 
                onClick={applyDateFilter}
              >
                Apply
              </button>
            </div>
          </div>
          
          <div className="alert alert-info shadow-lg">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Current analysis range: {dateRange.startDate} to {dateRange.endDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-white shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Statistical Summary</h2>
            <button onClick={loadAnalysisData} className="btn btn-sm btn-outline">
              🔄 Refresh Data
            </button>
          </div>

          {analysisData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="stat bg-base-100 rounded-box">
                <div className="stat-title">Temperature</div>
                <div className="stat-value text-primary">{analysisData.summary.temperature.mean.toFixed(1)}°C</div>
                <div className="stat-desc">
                  Range: {analysisData.summary.temperature.min}°C to {analysisData.summary.temperature.max}°C
                </div>
                <div className="stat-desc">
                  Trend: {formatTrend(analysisData.trends.temperature)}
                </div>
              </div>
              
              <div className="stat bg-base-100 rounded-box">
                <div className="stat-title">Humidity</div>
                <div className="stat-value text-secondary">{analysisData.summary.humidity.mean.toFixed(1)}%</div>
                <div className="stat-desc">
                  Range: {analysisData.summary.humidity.min}% to {analysisData.summary.humidity.max}%
                </div>
                <div className="stat-desc">
                  Trend: {formatTrend(analysisData.trends.humidity)}
                </div>
              </div>
              
              <div className="stat bg-base-100 rounded-box">
                <div className="stat-title">Pressure</div>
                <div className="stat-value text-accent">{analysisData.summary.pressure.mean.toFixed(2)} hPa</div>
                <div className="stat-desc">
                  Range: {analysisData.summary.pressure.min} hPa to {analysisData.summary.pressure.max} hPa
                </div>
                <div className="stat-desc">
                  Trend: {formatTrend(analysisData.trends.pressure)}
                </div>
              </div>
              
              <div className="stat bg-base-100 rounded-box">
                <div className="stat-title">Light</div>
                <div className="stat-value text-info">{analysisData.summary.light.mean.toFixed(1)} lux</div>
                <div className="stat-desc">
                  Range: {analysisData.summary.light.min} lux to {analysisData.summary.light.max} lux
                </div>
                <div className="stat-desc">
                  Trend: {formatTrend(analysisData.trends.light)}
                </div>
              </div>
              
              <div className="stat bg-base-100 rounded-box">
                <div className="stat-title">Rain Score</div>
                <div className="stat-value text-warning">{analysisData.summary.rain_score.mean.toFixed(2)}</div>
                <div className="stat-desc">
                  Range: {analysisData.summary.rain_score.min} to {analysisData.summary.rain_score.max}
                </div>
                <div className="stat-desc">
                  Trend: {formatTrend(analysisData.trends.rain_score)}
                </div>
              </div>
              
              <div className="stat bg-base-100 rounded-box">
                <div className="stat-title">Data Samples</div>
                <div className="stat-value">{analysisData.summary.temperature.count}</div>
                <div className="stat-desc">
                  Statistical confidence: High
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="ml-3">Loading analysis data...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="card bg-white shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Advanced Statistics</h2>
          
          {analysisData ? (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Min</th>
                    <th>25%</th>
                    <th>Median</th>
                    <th>75%</th>
                    <th>Max</th>
                    <th>StdDev</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Temperature (°C)</td>
                    <td>{analysisData.summary.temperature.min}</td>
                    <td>{analysisData.summary.temperature["25%"]}</td>
                    <td>{analysisData.summary.temperature["50%"]}</td>
                    <td>{analysisData.summary.temperature["75%"]}</td>
                    <td>{analysisData.summary.temperature.max}</td>
                    <td>{analysisData.summary.temperature.std.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Humidity (%)</td>
                    <td>{analysisData.summary.humidity.min}</td>
                    <td>{analysisData.summary.humidity["25%"]}</td>
                    <td>{analysisData.summary.humidity["50%"]}</td>
                    <td>{analysisData.summary.humidity["75%"]}</td>
                    <td>{analysisData.summary.humidity.max}</td>
                    <td>{analysisData.summary.humidity.std.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Pressure (hPa)</td>
                    <td>{analysisData.summary.pressure.min}</td>
                    <td>{analysisData.summary.pressure["25%"]}</td>
                    <td>{analysisData.summary.pressure["50%"]}</td>
                    <td>{analysisData.summary.pressure["75%"]}</td>
                    <td>{analysisData.summary.pressure.max}</td>
                    <td>{analysisData.summary.pressure.std.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Light (lux)</td>
                    <td>{analysisData.summary.light.min}</td>
                    <td>{analysisData.summary.light["25%"]}</td>
                    <td>{analysisData.summary.light["50%"]}</td>
                    <td>{analysisData.summary.light["75%"]}</td>
                    <td>{analysisData.summary.light.max}</td>
                    <td>{analysisData.summary.light.std.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td>Rain Score</td>
                    <td>{analysisData.summary.rain_score.min}</td>
                    <td>{analysisData.summary.rain_score["25%"]}</td>
                    <td>{analysisData.summary.rain_score["50%"]}</td>
                    <td>{analysisData.summary.rain_score["75%"]}</td>
                    <td>{analysisData.summary.rain_score.max}</td>
                    <td>{analysisData.summary.rain_score.std.toFixed(4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Loading advanced statistics...</p>
          )}
        </div>
      </div>

      {/* Footer / System Status */}
      <footer className="mt-10 text-sm text-center text-gray-500">
        System Status: 🟢 Online | Last updated: {lastUpdated}
      </footer>
    </div>
  );
};

export default Analysis; 