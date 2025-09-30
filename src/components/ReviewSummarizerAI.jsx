import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ReviewSummarizerFlask = ({ reviews }) => {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const apiUrl = import.meta.env.VITE_API_URL;


    useEffect(() => {
  const fetchSummary = async () => {
    if (!apiUrl) {
      setError("API URL not configured.");
      setLoading(false);
      return;
    }

    if (!reviews || reviews.length === 0) {
      setSummary("No reviews to summarize.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/summarize`, { reviews });
      setSummary(res.data.summary);
      setError("");
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setSummary("");
      setError("Could not generate summary.");
    } finally {
      setLoading(false);
    }
  };

  fetchSummary();
}, [reviews, apiUrl]);


    return (
        <section className="pg-summary-box">
            {/* <h2>Summary from Student Reviews (AI - Local)</h2> */}
            {loading ? (
                <p>Loading summary...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <p>{summary}</p>
            )}
        </section>
    );
};

export default ReviewSummarizerFlask;
