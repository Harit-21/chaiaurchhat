export function mapRentOpinionToSymbol(opinion) {
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
            return 'No data';
    }
}

export function mapHappinessLevelToEmoji(level) {
    switch (level?.toLowerCase()) {
        case 'yes':
        case 'satisfied':
            return '😁';
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
