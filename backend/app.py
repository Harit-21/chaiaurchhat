from flask import Flask, request, jsonify
from transformers import pipeline
import nltk
from nltk.tokenize.punkt import PunktSentenceTokenizer, PunktParameters
from nltk.tokenize import sent_tokenize
from flask_cors import CORS

nltk.download('punkt')
tokenizer = PunktSentenceTokenizer()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Allow your React frontend

# Load the summarizer once at startup

# summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
summarizer = pipeline("summarization", model="google/pegasus-xsum")


@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        data = request.get_json(force=True)
        print("🔹 Received data:", data)  # 👈 log input
        reviews = data.get("reviews", [])

        if not reviews:
            return jsonify({"summary": "No reviews provided."}), 400

        # Extract valid comments
        comments = [r.get("comment", "").strip() for r in reviews if r.get("comment")]
        if not comments:
            return jsonify({"summary": "No valid review comments found."}), 400

        text = " ".join(comments)
        sentences = tokenizer.tokenize(text)
        print("🔹 Tokenized sentences:", sentences)  # 👈 log tokenized input

        chunks = [" ".join(sentences[i:i + 5]) for i in range(0, len(sentences), 5)]
        print("🔹 Text chunks:", chunks)  # 👈 log chunks sent to model

        # summaries = []
        # for chunk in chunks:
        #     if chunk.strip():
        #         result = summarizer(chunk, max_length=60, min_length=25, do_sample=False)
        #         summaries.append(result[0]["summary_text"])

        summaries = []
        for i, chunk in enumerate(chunks):
            input_len = len(chunk.split())
            print(f"\n🔸 Chunk {i+1} ({input_len} words):\n{chunk}\n")

            result = summarizer(
                chunk,
                max_length=min(60, input_len),
                min_length=15,
                do_sample=False
            )

            print("🔹 Model summary:", result)
            summaries.append(result[0]["summary_text"])

        # summaries = []

        # for i, chunk in enumerate(chunks):
        #     input_len = len(chunk.split())
        #     print(f"\n🔸 Chunk {i+1} ({input_len} words):\n{chunk}\n")

        #     # Skip chunks that are too short to summarize meaningfully
        #     if input_len < 10:
        #         print("⚠️ Chunk too short to summarize well. Appending as-is.")
        #         summaries.append(chunk)
        #         continue

        #     # Dynamically calculate summary length
        #     max_len = min(80, max(30, input_len))   # cap at 80 tokens
        #     min_len = min(25, max(10, input_len // 3))  # floor and relative min

        #     try:
        #         result = summarizer(
        #             chunk,
        #             max_length=max_len,
        #             min_length=min_len,
        #             do_sample=False,  # deterministic
        #             truncation=True
        #         )
        #         print("🔹 Model summary:", result)
        #         summaries.append(result[0]["summary_text"])

        #     except Exception as e:
        #         print("❌ Error summarizing chunk:", e)
        #         summaries.append(chunk)  # fallback

        final_summary = " ".join(summaries)
        return jsonify({"summary": final_summary})

    except Exception as e:
        print("Error during summarization:", e)
        return jsonify({"summary": "An error occurred", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
