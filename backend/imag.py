from flask import Flask, jsonify, request
import time
import hmac
import hashlib
import os
import base64
import requests
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

PRIVATE_API_KEY = os.getenv("IMAGEKIT_PRIVATE_API_KEY")
PUBLIC_API_KEY = os.getenv("IMAGEKIT_PUBLIC_API_KEY")

@app.route('/imagekit-auth', methods=['GET'])
def imagekit_auth():
    token = str(int(time.time()))
    expire = int(time.time()) + 240
    message = token + str(expire)

    signature = hmac.new(
        bytes(PRIVATE_API_KEY, 'utf-8'),
        msg=bytes(message, 'utf-8'),
        digestmod=hashlib.sha1
    ).hexdigest()

    return jsonify({
        "token": token,
        "expire": expire,
        "signature": signature,
        "publicKey": PUBLIC_API_KEY
    })

# ✅ Add this route to delete an image
@app.route('/imagekit-delete', methods=['POST'])
def imagekit_delete():
    data = request.json
    file_id = data.get("fileId")

    if not file_id:
        return jsonify({"success": False, "error": "Missing fileId"}), 400

    url = f"https://api.imagekit.io/v1/files/{file_id}"
    auth_header = base64.b64encode(f"{PRIVATE_API_KEY}:".encode()).decode()

    response = requests.delete(url, headers={
        "Authorization": f"Basic {auth_header}"
    })

    if response.status_code == 204:
        return jsonify({"success": True})
    else:
        return jsonify({
            "success": False,
            "status": response.status_code,
            "error": response.text
        }), response.status_code

if __name__ == '__main__':
    app.run(port=5000)
