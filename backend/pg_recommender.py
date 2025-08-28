import requests
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

HEADERS = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}"
}

def fetch_data():
    pgs_url = f"{SUPABASE_URL}/rest/v1/pgs?select=*"
    reviews_url = f"{SUPABASE_URL}/rest/v1/reviews?select=pg_id,comment"

    pg_resp = requests.get(pgs_url, headers=HEADERS)
    rev_resp = requests.get(reviews_url, headers=HEADERS)

    if not pg_resp.ok or not rev_resp.ok:
        raise Exception("Failed to fetch data from Supabase")

    pgs = pd.DataFrame(pg_resp.json())
    reviews = pd.DataFrame(rev_resp.json())

    # Merge review comments with PGs
    reviews = reviews.groupby("pg_id")["comment"].apply(lambda x: " ".join(filter(None, x))).reset_index()
    merged = pgs.merge(reviews, how="left", left_on="id", right_on="pg_id")

    return merged

def build_similarity_matrix(df):
    def combine_text(row):
        tags = " ".join(row.get("tags") or [])
        gender = row.get("gender_type", "")
        # desc = row.get("description", "")
        college = row.get("college", "")
        comment = row.get("comment", "")
        return f"{tags} {desc} {comment} {gender} {college}".lower()

    df["combined"] = df.apply(combine_text, axis=1)

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(df["combined"])
    cosine_sim = cosine_similarity(tfidf_matrix)

    return df, cosine_sim

def recommend_pg(pg_name, top_n=3, rating_margin=0.45):
    df = fetch_data()

    if pg_name not in df["name"].values:
        print(f"PG named '{pg_name}' not found.")
        return []

    df, cosine_sim = build_similarity_matrix(df)

    idx = df[df["name"] == pg_name].index[0]
    target_rating = df.loc[idx, "rating"]
    target_college_id = df.loc[idx, "college_id"]

    if pd.isna(target_rating):
        print(f"No rating available for '{pg_name}'")
        return []

    mask = (
        (df["college_id"] == target_college_id) &
        (df["rating"].notna()) &
        (abs(df["rating"] - target_rating) <= rating_margin) &
        (df.index != idx)
    )

    similar_scores = [(i, cosine_sim[idx][i]) for i in df[mask].index]
    similar_scores.sort(key=lambda x: x[1], reverse=True)

    recommendations = df.loc[[i for i, _ in similar_scores[:top_n]], "name"].tolist()
    return recommendations
