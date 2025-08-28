import React from 'react';
import '../css/PGDetailPage.css';
import ReviewSummarizerAI from '../components/ReviewSummarizerAI';
import StarRating from './PGDetailPage/StarRating';

const ReviewSummaryPanel = ({ summary, breakdown, livedHereStats, tags, reviewList, rentOpinionStats, happinessLevelStats }) => {

    function getMostFrequentOption(stats) {
        if (!stats || Object.keys(stats).length === 0) return 'No data';
        let maxCount = 0;
        let topOption = '';
        for (const [option, count] of Object.entries(stats)) {
            if (count > maxCount) {
                maxCount = count;
                topOption = option;
            }
        }
        return topOption;
    }

    function mapRentOpinionToSymbol(opinion) {
        switch (opinion?.toLowerCase()) {
            case 'low':
                return '₹';
            case 'reasonable':
            case 'medium':
                return '₹₹';
            case 'high':
            case 'expensive':
                return '₹₹₹';
            default:
                return 'no data';
        }
    }

    function mapHappinessLevelToEmoji(level) {
        switch (level?.toLowerCase()) {
            case 'yes':
            case 'satisfied':
                return '😊';
            case 'just fine':
            case 'okay':
                return '😐';
            case 'no':
            case 'dissatisfied':
                return '😞';
            default:
                return '¯\\_(ツ)_/¯';
        }
    }


    const topRentOpinion = getMostFrequentOption(rentOpinionStats);
    const topHappinessLevel = getMostFrequentOption(happinessLevelStats);


    const maxCount = Math.max(...Object.values(livedHereStats));

    return (
        <section className="review-summary-panel">
            <div className="left-summary">
                <h3>🧠 What Students Say</h3>
                <ReviewSummarizerAI reviews={reviewList} />
                <p>{summary}</p>
            </div>

            <hr />

            <div className="right-breakdown">
                <div className="rate-break">
                    {/* <h4>📈 Rating Breakdown</h4> */}
                    <ul>
                        {Object.entries(breakdown).map(([key, value]) => (
                            <li key={key}><strong>{key}</strong>: <StarRating rating={value} /> </li>
                        ))}
                    </ul>
                </div>

                <hr />

                <h4>🗓️ When Students Lived Here</h4>
                <div className="lived-here-bar">
                    {Object.entries(livedHereStats).map(([year, count]) => (
                        <div key={year} className="year-row">
                            <span className="year">{year}</span>
                            <div className="bar-container" title={`${count} students lived here in ${year}`}>
                                <div
                                    className="bar"
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                />
                            </div>
                            <span className="count">{count}</span>
                        </div>
                    ))}
                </div>

                <hr />

                <div className="additional-summary">
                    <h4></h4>
                    <p><span className='emo-indicators'><strong>💰Rent:</strong> <span rentindicate={topRentOpinion} id='rent-indicate'>{mapRentOpinionToSymbol(topRentOpinion)}</span></span></p>
                    <p><span className='emo-indicators'><strong>😁Are Residents Happy:</strong> <span id='hp-indicate' hpindicate={topHappinessLevel}> {mapHappinessLevelToEmoji(topHappinessLevel)}</span></span></p>
                </div>


                {/* <h4>🏷️ Common Tags</h4> */}
                <div className="tags">
                    {tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ReviewSummaryPanel;
