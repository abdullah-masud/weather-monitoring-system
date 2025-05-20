import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AnalysisPage = () => {
  const navigate = useNavigate();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analyze?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <button onClick={() => navigate(-1)} className="btn btn-ghost mb-4">
        ← Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-4">📈 Weather Analysis</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-1">Start (YYYY-MM-DD HH:mm:ss)</label>
          <input
            type="text"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="2025-05-01 00:00:00"
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block mb-1">End (YYYY-MM-DD HH:mm:ss)</label>
          <input
            type="text"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="2025-05-03 23:45:00"
            className="input input-bordered w-full"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        className="btn btn-primary mb-6"
        disabled={loading || !start || !end}
      >
        {loading ? "Analyzing..." : "Run Analysis"}
      </button>

      {error && <p className="text-red-500">Error: {error}</p>}

      {result && (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-2">Summary Statistics</h2>
            {Object.entries(result.summary).map(([key, stats]) => (
              <div key={key} className="mb-4">
                <h3 className="font-bold capitalize">{key}</h3>
                <ul className="list-disc pl-5">
                  {Object.entries(stats).map(([stat, val]) => (
                    <li key={stat}>
                      <strong>{stat}:</strong> {val}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Trends (slope per second)</h2>
            <ul className="list-disc pl-5">
              {Object.entries(result.trends).map(([key, slope]) => (
                <li key={key} className="capitalize">
                  <strong>{key}:</strong> {slope.toFixed(6)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
