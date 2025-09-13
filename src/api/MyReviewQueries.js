import { apiUrl } from '../api';

export const fetchUserReviews = async (email) => {
    const res = await fetch(`${apiUrl}/user-reviews?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Failed to fetch user reviews");
    const data = await res.json();

    const reviewsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.reviews)
        ? data.reviews
        : Array.isArray(data.data)
        ? data.data
        : [];

    return reviewsArray.map(r => ({
        ...r,
        has_food: r.has_food === true,
    }));
};

export const fetchWishlist = async (email) => {
    const res = await fetch(`${apiUrl}/wishlist?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Failed to fetch wishlist");
    return await res.json();
};
