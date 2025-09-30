import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from pg_recommender import recommend_pg
from datetime import datetime, timezone
from uuid import UUID
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

app = Flask(__name__)
CORS(app, supports_credentials=True, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], origins=["http://localhost:5173", "https://chaiaurchhat.vercel.app"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")


HEADERS = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

@app.route("/pg", methods=["GET"])
def get_pg_by_name():
    name = request.args.get("name")

    view_resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/pg_whole_info?name=eq.{name}",
        headers=HEADERS
    )
    if not view_resp.ok or not view_resp.json():
        return jsonify({"error": "PG not found"}), 404
    pg = view_resp.json()[0]

    reviews_res = requests.get(
        f"{SUPABASE_URL}/rest/v1/reviews?pg_id=eq.{pg['id']}&order=date.desc",
        headers=HEADERS
    )
    pg["reviewList"] = reviews_res.json() if reviews_res.ok else []

    return jsonify(pg)


@app.route("/colleges", methods=["GET"])
def get_all_colleges():
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/colleges?select=*",
            headers=HEADERS
        )
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        print(f"Error fetching colleges: {e}")
        return jsonify({"error": "Failed to fetch colleges"}), 500


@app.route("/trending-pgs", methods=["GET"])
def trending_pgs():
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/pg_whole_info?select=*&order=avg_rating.desc.nullslast&limit=6",
            headers=HEADERS
        )
        if not response.ok:
            print("Supabase error:", response.text)
            return jsonify({"error": "Failed to fetch PGs"}), 500

        data = response.json()
        # Backward compatibility: also return `rating`
        for pg in data:
            if "avg_rating" in pg:
                pg["rating"] = pg["avg_rating"]

        return jsonify(data)
    except Exception as e:
        print("Error fetching trending PGs:", e)
        return jsonify({"error": "Server error"}), 500


@app.route("/college/<college_name>", methods=["GET"])
def get_college(college_name):
    try:
        print(f"Fetching college: {college_name}")
        
        # Ask Supabase for all needed columns, including image
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/colleges"
            f"?name=eq.{college_name}"
            f"&select=id,name,short_name,city,image",
            headers=HEADERS
        )

        data = resp.json()
        
        if not resp.ok or not data:
            return jsonify({"error": "College not found"}), 404

        return jsonify(data[0])
    
    except Exception as e:
        print("Error fetching college:", e)
        return jsonify({'error': 'Internal error'}), 500

@app.route("/search", methods=["GET"])
def search_entities():
    query = request.args.get("q", "").lower()

    if not query:
        return jsonify({"colleges": [], "pgs": []})

    # Search in colleges
    college_resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/colleges?or=(name.ilike.*{query}*,city.ilike.*{query}*,short_name.ilike.*{query}*)&select=name,city,short_name",
        headers=HEADERS
    )

    # Search in PGs
    pg_resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/pg_whole_info?or=(name.ilike.*{query}*,location.ilike.*{query}*,college_city.ilike.*{query}*,college_name.ilike.*{query}*,college_short_name.ilike.*{query}*)&select=name,location,college_city,college_name,college_short_name",
        headers=HEADERS
    )

    return jsonify({
        "colleges": college_resp.json() if college_resp.ok else [],
        "pgs": pg_resp.json() if pg_resp.ok else []
    })

@app.route("/pgs/add", methods=["POST"])
def add_pg():
    data = request.get_json()

    required_fields = ["name", "college_id", "gender_type"]
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field} is required"}), 400

    # Fetch college info from Supabase
    college_resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/colleges?id=eq.{data['college_id']}&select=short_name,city",
        headers=HEADERS
    )

    if not college_resp.ok or not college_resp.json():
        return jsonify({"error": "College not found"}), 400

    college_info = college_resp.json()[0]
    college_short = college_info.get("short_name", "")
    college_city = college_info.get("city", "")
    location_str = f"{college_short}, {college_city}".strip(", ")

    pg_data = {
        "name": data["name"],
        "college_id": data["college_id"],
        "gender_type": data["gender_type"],
        "has_food": data.get("has_food", "Yes") == "Yes",
        "description": data.get("description", ""),
        "image": data.get("image", ""),
        "location": location_str,
        "inside_campus": data.get("inside_campus"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude")
    }

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/pgs",
        headers=HEADERS,
        json=pg_data
    )

    if not resp.ok:
        return jsonify({"error": "Failed to add hostel", "details": resp.text}), 500

    return jsonify(resp.json()[0]), 201



@app.route("/pgs", methods=["GET"])
def get_all_pgs():
    college_id = request.args.get("college_id")
    query = f"{SUPABASE_URL}/rest/v1/pg_whole_info"
    if college_id:
        query += f"?college_id=eq.{college_id}"
    res = requests.get(query, headers=HEADERS)

    if not res.ok:
        return jsonify({"error": "Failed to fetch PGs"}), 500

    return jsonify(res.json())

@app.route('/recommend', methods=['GET'])
def recommend():
    pg_name = request.args.get("pg")

    if not pg_name:
        return jsonify([])

    try:
        # Get target PG info
        pg_resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/pg_whole_info?name=eq.{pg_name}",
            headers=HEADERS
        )
        if not pg_resp.ok or not pg_resp.json():
            return jsonify([])

        pg_info = pg_resp.json()[0]
        college_id = pg_info.get("college_id")
        location = pg_info.get("college_city")
        rating = pg_info.get("avg_rating", 0)
        tags = pg_info.get("tags") or []
        pg_id = pg_info.get("id")
        gender_type = pg_info.get("gender_type")

        if rating is None:
            rating = 0

        # Build filter
        query = (
            f"{SUPABASE_URL}/rest/v1/pg_whole_info"
            f"?and=(id.neq.{pg_id},avg_rating.gte.{rating - 0.5},avg_rating.lte.{rating + 0.5})"
        )

        if college_id:
            query += f"&college_id=eq.{college_id}"
        elif location:
            query += f"&college_city=eq.{location}"

        query += "&select=name,tags,image,location,avg_rating"
        
        if gender_type:
            query += f"&gender_type=eq.{gender_type}"

        # inside_campus = pg_info.get("inside_campus")
        # if inside_campus is not None:
        #     query += f"&inside_campus=eq.{str(inside_campus).lower()}"

        all_resp = requests.get(query, headers=HEADERS)
        if not all_resp.ok:
            print("Error in fetching similar PGs:", all_resp.text)
            return jsonify([])

        similar_pgs = all_resp.json()

        # Optional: filter by overlapping tags
        # def tag_overlap(pg):
        #     if not tags or not pg.get("tags"):
        #         return False
        #     return any(tag in pg["tags"] for tag in tags)

        # similar_filtered = [pg for pg in similar_pgs if tag_overlap(pg)]
        # return jsonify(similar_filtered[:6])
        def tag_overlap_score(pg):
            return len(set(tags) & set(pg.get("tags", [])))

        similar_filtered = sorted(
            similar_pgs,
            key=tag_overlap_score,
            reverse=True
        )
        return jsonify(similar_filtered[:6])

    except Exception as e:
        print("Error in /recommend:", e)
        return jsonify([])



@app.route("/review/helpful", methods=["POST"])
def mark_review_helpful():
    data = request.get_json()
    review_id = data.get("review_id")
    user_email = data.get("user_email")

    if not review_id or not user_email:
        return jsonify({"error": "review_id and user_email required"}), 400

    # Call the RPC function
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/toggle_helpful_vote",
        headers=HEADERS,
        json={"p_review_id": review_id, "p_user_email": user_email},
    )
    if not resp.ok:
        return jsonify({"error": "toggle_helpful_vote failed", "details": resp.text}), 500

    new_count = resp.json()  # returns integer helpful_count
    return jsonify({"review_id": review_id, "helpful_count": new_count})



@app.route("/user-reviews", methods=["GET"])
def get_user_reviews():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Missing email"}), 400

    # Join reviews with pg info to get pg_name and college_name
    query = (
        f"{SUPABASE_URL}/rest/v1/reviews_with_pg_info?"
        f"user_email=eq.{email}&order=date.desc"
    )

    resp = requests.get(query, headers=HEADERS)

    if not resp.ok:
        return jsonify({"error": "Failed to fetch user reviews"}), 500

    return jsonify(resp.json())

@app.route("/reviews/<review_id>", methods=["DELETE"])
def delete_review(review_id):
    if request.method == "OPTIONS":
        return '', 204

    url = f"{SUPABASE_URL}/rest/v1/reviews?id=eq.{review_id}"
    resp = requests.delete(url, headers=HEADERS)
    print(f"DELETE status: {resp.status_code}, response: {resp.text}")

    if resp.status_code in (200, 204):
        return jsonify({"message": "Deleted"}), 200
    else:
        return jsonify({
            "error": "Failed to delete",
            "details": resp.text,
            "status_code": resp.status_code
        }), 500


@app.route('/review/submit', methods=['POST'])
def submit_review():
    data = request.get_json()

    pg_name = data.get('pgName')
    pg_resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/pgs?name=eq.{pg_name}",
        headers=HEADERS
    )
    if not pg_resp.ok or not pg_resp.json():
        return jsonify({'success': False, 'error': 'PG not found'}), 404

    pg_id = pg_resp.json()[0]['id']

    # Only include valid ratings and skip food rating if not applicable
    ratings = {}
    for field in [
        "rating_room", "rating_cleanliness", "rating_safety",
        "rating_location", "rating_warden", "rating_food"
    ]:
        value = data.get(field)
        if field == "rating_food" and not data.get("hasFood", False):
            continue
        if isinstance(value, int):
            ratings[field] = value

    avg_rating = round(sum(ratings.values()) / len(ratings), 1) if ratings else 0
    user_email = data.get('userEmail', '')
    verified = user_email.endswith('.edu') or user_email.endswith('.ac.in')

    review_data = {
        "pg_id": pg_id,
        "name": "Anonymous",
        "user_email": data.get('userEmail'),
        "rating": avg_rating,
        "comment": data.get('comment', ''),
        "sentiment": data.get('sentiment', 'Neutral'),
        "tags": data.get('tags') or [],
        "class_years": data.get('classYears') or [],
        "room_type": data.get('roomType'),
        "gender_type": data.get('genderType'),
        "rent_opinion": data.get('rentOpinion'),
        "happiness_level": data.get('happinessLevel'),
        "images": [
            {
                "url": img.get("url"),
                "fileId": img.get("fileId"),
                "caption": img.get("caption"),
                "originalName": img.get("originalName"),
                "originalSize": img.get("originalSize"),
                "imageTags": img.get("imageTags")
            }
            for img in data.get("images", [])
        ],
        "date": datetime.now(timezone.utc).date().isoformat(),
        "helpful_count": 0,
        "verified": verified
    }

    review_data.update(ratings)

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/reviews",
        headers=HEADERS,
        json=review_data
    )

    if not resp.ok:
        print("Review data payload:", review_data)
        print("Supabase response:", resp.text)
        return jsonify({'success': False, 'error': 'Could not store review'}), 500

    return jsonify({'success': True, 'review': resp.json()[0]}), 200

@app.route('/review/update', methods=['PUT'])
def update_review():
    data = request.get_json()
    review_id = data.get('review_id')

    if not review_id:
        return jsonify({'success': False, 'error': 'Missing review ID'}), 400

    # Ratings logic
    ratings = {}
    for field in [
        "rating_room", "rating_cleanliness", "rating_safety",
        "rating_location", "rating_warden", "rating_food"
    ]:
        value = data.get(field)
        if field == "rating_food" and not data.get("hasFood", False):
            continue
        if isinstance(value, int):
            ratings[field] = value

    avg_rating = round(sum(ratings.values()) / len(ratings), 1) if ratings else 0

    update_payload = {
        "rating": avg_rating,
        "comment": data.get('comment', ''),
        "sentiment": data.get('sentiment', 'Neutral'),
        "tags": data.get('tags') or [],
        "class_years": data.get('classYears') or [],
        "room_type": data.get('roomType'),
        "rent_opinion": data.get('rentOpinion'),
        "happiness_level": data.get('happinessLevel'),
        "images": [
            {
                "url": img.get("url"),
                "fileId": img.get("fileId"),
                "caption": img.get("caption"),
                "originalName": img.get("originalName"),
                "originalSize": img.get("originalSize"),
                "imageTags": img.get("imageTags")
            }
            for img in data.get("images", [])
        ],
        "date": datetime.now(timezone.utc).isoformat(),  # full ISO datetime
        "helpful_count": 0
    }

    # Remove nulls explicitly
    update_payload = {k: v for k, v in update_payload.items() if v is not None}

    # Add ratings explicitly if int
    for field in [
        "rating_room", "rating_cleanliness", "rating_safety",
        "rating_location", "rating_warden"
    ]:
        value = data.get(field)
        if isinstance(value, int):
            update_payload[field] = value

    if data.get("hasFood", False):
        rating_food = data.get("rating_food")
        if isinstance(rating_food, int):
            update_payload["rating_food"] = rating_food

    update_payload.update(ratings)

    url = f"{SUPABASE_URL}/rest/v1/reviews?id=eq.{review_id}"

    custom_headers = HEADERS.copy()
    custom_headers["Prefer"] = "return=representation"

    patch_resp = requests.patch(url, headers=custom_headers, json=update_payload)

    if patch_resp.status_code in (200, 201):
        result = patch_resp.json()
        return jsonify({'success': True, 'updatedId': result[0]['id']}), 200
    else:
        print("Update failed:", patch_resp.text)
        return jsonify({'success': False, 'error': 'Update failed'}), 500

@app.route("/wishlist/add", methods=["POST"])
def add_to_wishlist():
    data = request.get_json()
    email = data.get("email")
    pg_id = data.get("pg_id")
    
    if not email or not pg_id:
        return jsonify({"error": "Missing email or pg_id"}), 400

    payload = {
        "user_email": email,
        "pg_id": pg_id
    }

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/wishlist",
        headers=HEADERS,
        json=payload
    )

    if not resp.ok:
        return jsonify({"error": "Failed to add to wishlist"}), 500

    return jsonify({"success": True}), 201


@app.route("/wishlist", methods=["GET"])
def get_wishlist():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Missing email"}), 400

    query = (
        f"{SUPABASE_URL}/rest/v1/wishlist_with_pg_info?user_email=eq.{email}&select=pg_id,added_at,pgs(*),pg_whole_info(college_name)"
    )

    resp = requests.get(query, headers=HEADERS)
    if not resp.ok:
        return jsonify({"error": "Failed to fetch wishlist"}), 500

    data = resp.json()
    transformed = [{
        "pg_id": item["pg_id"],
        "added_at": item["added_at"],
        "name": item["pgs"]["name"],
        "collegeName": item["pgs"]["location"],
        "rating": item["pgs"]["avg_rating"],
        "image": item["pgs"]["image"],
        "location": item["pg_whole_info"]["college_name"],
    } for item in data]

    return jsonify(transformed)

@app.route("/wishlist/remove", methods=["DELETE"])
def remove_from_wishlist():
    data = request.get_json()
    email = data.get("email")
    pg_id = data.get("pg_id")

    if not email or not pg_id:
        return jsonify({"error": "Missing email or pg_id"}), 400

    url = f"{SUPABASE_URL}/rest/v1/wishlist?user_email=eq.{email}&pg_id=eq.{pg_id}"

    resp = requests.delete(url, headers=HEADERS)

    if resp.status_code in (200, 204):
        return jsonify({"success": True}), 200
    else:
        return jsonify({"error": "Failed to remove from wishlist"}), 500



if __name__ == "__main__":
    app.run(debug=True, port=5000)
