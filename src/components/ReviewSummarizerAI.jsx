import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ReviewSummarizerFlask = ({ reviews }) => {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSummary = async () => {
            if (!reviews || reviews.length === 0) {
                setSummary("No reviews to summarize.");
                setLoading(false);
                return;
            }

            try {
                const res = await axios.post("http://localhost:5000/summarize", {
                     reviews,

                });

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
    }, [reviews]);

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
