from flask import Flask, request, jsonify
from transformers import pipeline, BartTokenizer
import nltk
from nltk.tokenize.punkt import PunktSentenceTokenizer
from flask_cors import CORS

nltk.download('punkt')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "https://chaiaurchhat.vercel.app"]}}, supports_credentials=True)


model_name = "sshleifer/distilbart-cnn-12-6"
#summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

tokenizer = BartTokenizer.from_pretrained(model_name)
summarizer = pipeline("summarization", model=model_name)

sentence_tokenizer = PunktSentenceTokenizer()

MAX_TOKENS = 1024  # BART-large-CNN max tokens per input

def chunk_text(text, max_tokens=MAX_TOKENS):
    sentences = sentence_tokenizer.tokenize(text)
    chunks = []
    current_chunk = []
    current_len = 0

    for sentence in sentences:
        sentence_len = len(tokenizer.tokenize(sentence))
        if current_len + sentence_len > max_tokens:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_len = sentence_len
        else:
            current_chunk.append(sentence)
            current_len += sentence_len

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def dynamic_summary_length(chunk_text):
    length = len(tokenizer.tokenize(chunk_text))
    max_length = min(140, max(100, length // 3))
    min_length = min(80, max(50, length // 6))
    return min_length, max_length

@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        data = request.get_json(force=True)
        reviews = data.get("reviews", [])

        if not reviews:
            return jsonify({"summary": "No reviews provided."}), 400

        comments = [r.get("comment", "").strip() for r in reviews if r.get("comment")]
        if not comments:
            return jsonify({"summary": "No valid review comments found."}), 400

        full_text = " ".join(comments)
        chunks = chunk_text(full_text)

        summaries = []
        for i, chunk in enumerate(chunks):
            min_len, max_len = dynamic_summary_length(chunk)

            try:
                result = summarizer(
                    chunk,
                    max_length=max_len,
                    min_length=min_len,
                    do_sample=False,
                    truncation=True
                )
                summaries.append(result[0]['summary_text'])
            except Exception as e:
                print(f"❌ Error summarizing chunk {i+1}: {e}")
                summaries.append(chunk)

        if len(summaries) > 1:
            combined_summary_text = " ".join(summaries)
            min_len, max_len = dynamic_summary_length(combined_summary_text)

            try:
                final_result = summarizer(
                    combined_summary_text,
                    max_length=max_len,
                    min_length=min_len,
                    do_sample=False,
                    truncation=True
                )
                final_summary = final_result[0]['summary_text']
            except Exception as e:
                print(f"❌ Error in final summary step: {e}")
                final_summary = combined_summary_text
        else:
            final_summary = summaries[0]

        return jsonify({"summary": final_summary})

    except Exception as e:
        print("Error during summarization:", e)
        return jsonify({"summary": "An error occurred", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)