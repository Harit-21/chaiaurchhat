import { apiUrl } from "../api";

export const fetchAllPGs = async () => {
  const res = await fetch(`${apiUrl}/pgs`);
  if (!res.ok) throw new Error('Failed to fetch PG list');
  return res.json();
};

export const fetchPGDetail = async ({ pgName, collegeName }) => {
  const res = await fetch(`${apiUrl}/pg?name=${encodeURIComponent(pgName)}&college=${encodeURIComponent(collegeName)}`);
  if (!res.ok) throw new Error('Failed to fetch PG detail');
  return res.json();
};

export const fetchRecommendations = async (pgName) => {
  const res = await fetch(`${apiUrl}/recommend?pg=${encodeURIComponent(pgName)}`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
};
