import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router";

const Dashboard = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [historicalData, setHistoricalData] = useState(null);

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
    const fetchData = () => {
      fetch("/api/data")
        .then((res) => res.json())
        .then((data) => {
          setData(data);
          setLastUpdated(new Date());
        })
        .catch((err) => console.error("Failed to fetch data:", err));
    };

    // get data
    fetchData();
    
    // get data every 10 seconds
    const intervalId = setInterval(fetchData, 10000);
    
    // clean up
    return () => clearInterval(intervalId);
  }, []);

  // get historical data
  useEffect(() => {
    fetch("/api/historical-data")
      .then((res) => res.json())
      .then((data) => {
        setHistoricalData(data);
      })
      .catch((err) => console.error("Failed to fetch historical data:", err));
      
    // update historical data every second
    const intervalId = setInterval(() => {
      fetch("/api/historical-data")
        .then((res) => res.json())
        .then((data) => {
          setHistoricalData(data);
        })
        .catch((err) => console.error("Failed to fetch historical data:", err));
    }, 1000);  
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Extremely simple chart implementation with direct HTML
  const renderBarChart = (dataPoints, title, color, forceFlatZeroBar = false) => {
    if (!dataPoints || dataPoints.length === 0) {
      return (
        <div style={{backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px'}}>
          <p style={{color: '#777'}}>No historical data available</p>
        </div>
      );
    }
    
    // remove duplicate time entries 
    const timeMap = new Map();
    dataPoints.forEach(dp => {
      timeMap.set(dp.time, dp.value);
    });
    
    // convert map back to array of unique data points
    const uniqueDataPoints = Array.from(timeMap.entries()).map(([time, value]) => ({time, value}));
    
    // sort by time
    uniqueDataPoints.sort((a, b) => a.time.localeCompare(b.time));
    
    // only show the last 10 unique data
    const recentDataPoints = uniqueDataPoints.slice(-10);
    
    const maxValue = Math.max(...recentDataPoints.map(d => d.value));
    const minValue = Math.min(...recentDataPoints.map(d => d.value));
    
    const getBarColor = () => {
      switch(color) {
        case 'bg-primary': return '#3a0ca3';
        case 'bg-secondary': return '#f72585';
        case 'bg-accent': return '#4cc9f0';
        case 'bg-neutral': return '#222222';
        case 'bg-warning': return '#ffbe0b';
        case 'bg-info': return '#4cc9f0';
        default: return '#4361ee';
      }
    };
    
    const barColor = getBarColor();
    
    // 修改高度逻辑
    const getBarHeightPx = (value) => {
      if (forceFlatZeroBar && maxValue === 0 && minValue === 0) {
        return 1; // 所有为0时，柱子高度为1px
      }
      const heightPercent = maxValue === minValue
        ? (maxValue === 0 ? (1 / 1.5) : 50)
        : Math.max(10, ((value - minValue) / (maxValue - minValue) * 80));
      return heightPercent * 1.5;
    };
    
    return (
      <div style={{backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px'}}>
        <h3 style={{fontWeight: '600', fontSize: '1.125rem', marginBottom: '12px'}}>{title}</h3>
        
        {/* Min/Max labels */}
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777', padding: '0 8px'}}>
          <div>Max: {Math.round(maxValue * 100) / 100}</div>
          <div>Min: {Math.round(minValue * 100) / 100}</div>
        </div>
        
        {/* Chart container */}
        <div style={{height: '180px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px', padding: '16px', marginTop: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
          {recentDataPoints.map((point, index) => {
            const barHeightPx = getBarHeightPx(point.value);
            
            return (
              <div key={index} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '8%'}}>
                {/* Value */}
                <div style={{fontSize: '0.75rem', marginBottom: '4px'}}>{Math.round(point.value * 10) / 10}</div>
                
                {/* Bar */}
                <div style={{
                  height: `${barHeightPx}px`, 
                  width: '100%', 
                  backgroundColor: barColor,
                  borderTopLeftRadius: '2px',
                  borderTopRightRadius: '2px'
                }}></div>
                
                {/* Time label */}
                <div style={{fontSize: '0.75rem', marginTop: '4px', color: '#777'}}>
                  {point.time.split(":").slice(0, 2).join(":")}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Statistics */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.875rem', marginTop: '12px'}}>
          <div style={{backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px'}}>
            <span style={{fontWeight: '600'}}>Latest: </span>
            <span style={{color: '#3a0ca3'}}>{recentDataPoints.length > 0 ? Math.round(recentDataPoints[recentDataPoints.length-1].value * 100) / 100 : 'N/A'}</span>
          </div>
          <div style={{backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px'}}>
            <span style={{fontWeight: '600'}}>Average: </span>
            <span style={{color: '#f72585'}}>{recentDataPoints.length > 0 ? Math.round((recentDataPoints.reduce((sum, dp) => sum + dp.value, 0) / recentDataPoints.length) * 100) / 100 : 'N/A'}</span>
          </div>
          <div style={{backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px'}}>
            <span style={{fontWeight: '600'}}>Maximum: </span>
            <span style={{color: '#4cc9f0'}}>{Math.round(maxValue * 100) / 100}</span>
          </div>
          <div style={{backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px'}}>
            <span style={{fontWeight: '600'}}>Minimum: </span>
            <span style={{color: '#7209b7'}}>{Math.round(minValue * 100) / 100}</span>
          </div>
        </div>
      </div>
    );
  };

  // rain level color mapping
  const getRainLevelColor = (level) => {
    switch(level) {
      case "No Rain": return "bg-amber-50 text-gray-800";
      case "Light Rain": return "bg-blue-200 text-gray-800";
      case "Moderate Rain": return "bg-blue-400 text-white";
      case "Heavy Rain": return "bg-blue-600 text-white";
      default: return "bg-amber-50 text-gray-800";
    }
  }

  // rain level icon mapping
  const getRainLevelIcon = (level) => {
    switch(level) {
      case "No Rain": return "☁️";
      case "Light Rain": return "🌦️";
      case "Moderate Rain": return "🌧️";
      case "Heavy Rain": return "⛈️";
      default: return "☁️";
    }
  }

  return (
      <div className="p-6 bg-base-200 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">🌦️ Smart Weather Dashboard</h1>
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

          {/* Pressure Card */}
          <div className="card bg-accent text-accent-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">📊 Pressure</h2>
              <p>{data.pressure}</p>
            </div>
          </div>

          {/* Rain Level Card */}
          <div className={`card ${getRainLevelColor(data.rainLevel)} shadow-xl`}>
            <div className="card-body">
              <h2 className="card-title">
                {getRainLevelIcon(data.rainLevel)} Rain Level
              </h2>
              <p>{data.rainLevel}</p>
            </div>
          </div>

          {/* Rain Score Card */}
          <div className="card bg-warning text-warning-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">💦 Rain Score</h2>
              <p>{parseFloat(data.rainScore).toFixed(2)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${parseFloat(data.rainScore) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Light Card */}
          <div className="card bg-info text-info-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title">☀️ Light</h2>
              <p>{data.light}</p>
            </div>
          </div>
        </div>

        {/* Historical Data */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">📊 Historical Data</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            {!historicalData ? (
              <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="ml-3">Loading historical data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderBarChart(historicalData.temperature, "Temperature (°C)", "bg-primary")}
                {renderBarChart(historicalData.humidity, "Humidity (%)", "bg-secondary")}
                {renderBarChart(historicalData.pressure, "Pressure (hPa)", "bg-accent")}
                {renderBarChart(historicalData.rainLevel, "Rain Level", "bg-neutral", true)}
                {renderBarChart(historicalData.rainScore, "Rain Score", "bg-warning", true)}
                {renderBarChart(historicalData.light, "Light (lux)", "bg-info")}
              </div>
            )}
          </div>
        </div>

        {/* Footer / System Status */}
        <footer className="mt-10 text-sm text-center text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()} | System Status: 🟢 Online
        </footer>
      </div>
  );
};

export default Dashboard;
