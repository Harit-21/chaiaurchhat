// AnimatedRatingChart.jsx
import React, { useEffect, useState } from 'react';

export default function AnimatedRatingChart({ rating, reviews }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = (rating / 5) * 100;
    let frame = 0;
    const anim = setInterval(() => {
      frame += 1;
      const val = Math.min(target, (frame / 100) * target);
      setProgress(val);
      if (val >= target) clearInterval(anim);
    }, 12);
    return () => clearInterval(anim);
  }, [rating]);

  return (
    <div className="animated-chart">
      <svg viewBox="0 0 36 36" className="circular-chart">
        <path
          className="circle-bg"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="circle"
          strokeDasharray={`${progress}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <text x="18" y="20.35" className="chart-text">
          {rating.toFixed(1)}
        </text>
      </svg>
      <small>{reviews} reviews</small>
    </div>
  );
}
