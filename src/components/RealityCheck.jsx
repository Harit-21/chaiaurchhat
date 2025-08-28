import React from 'react';
import '../css/PGDetail/RealityCheck.css';

const features = [
  { feature: '~', expected: '😎 Expectations', got: '🥲 Reality' },
  { feature: 'Hot Water', expected: '✅ Always', got: '⚠️ Sometimes' },
  { feature: 'WiFi', expected: '✅ Fast', got: '✅ Fast' },
  { feature: 'Food Quality', expected: '✅ Great', got: '❌ Below Avg' },
  { feature: 'Room Size', expected: '✅ Spacious', got: '✅ Spacious' },
];

const RealityCheck = () => {
  return (
    <section className="reality-check-bar">
      <h3>🧪 Reality Check</h3>
      <div className="strip-container">
        {features.map(({ feature, expected, got }, i) => (
          <div key={i} className="strip-item">
            <span className="strip-feature">{feature}</span>
            <span className="strip-expected">{expected}</span>
            <span className={`strip-got ${got.includes('❌') ? 'bad' : got.includes('⚠️') ? 'warn' : got.includes('🥲') ? 'blackreality' : 'good'}`}>
              {got}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RealityCheck;



// import React from 'react';
// import '../css/PGDetail/RealityCheck.css';

// const features = [
//   { feature: 'Hot Water', expected: '✅ Always', got: '⚠️ Sometimes' },
//   { feature: 'WiFi', expected: '✅ Fast', got: '✅ Fast' },
//   { feature: 'Food Quality', expected: '✅ Great', got: '❌ Below Avg' },
//   { feature: 'Room Size', expected: '✅ Spacious', got: '✅ Spacious' },
// ];

// const RealityCheck = () => {
//   return (
//     <section className="reality-check-bar">
//       <h3>🧪 Reality Check</h3>
//       <div className="strip-scroll">
//         {features.map(({ feature, expected, got }, i) => (
//           <div key={i} className="strip-card">
//             <div className="strip-feature">{feature}</div>
//             <div className="strip-row">
//               <span className="label">Expected</span>
//               <span className="value expected">{expected}</span>
//             </div>
//             <div className="strip-row">
//               <span className="label">Got</span>
//               <span className={`value got ${got.includes('❌') ? 'bad' : got.includes('⚠️') ? 'warn' : 'good'}`}>
//                 {got}
//               </span>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };

// export default RealityCheck;
