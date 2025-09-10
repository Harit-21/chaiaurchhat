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
@app.route('/imagekit-delete', methods=['POST'])
def imagekit_delete():
    data = request.json
    file_id = data.get("fileId")
    file_url = data.get("url")

    if not file_id or not file_url:
        return jsonify({"success": False, "error": "Missing fileId or url"}), 400

    # Step 1: Delete the file
    delete_url = f"https://api.imagekit.io/v1/files/{file_id}"
    auth_header = base64.b64encode(f"{PRIVATE_API_KEY}:".encode()).decode()

    delete_response = requests.delete(delete_url, headers={
        "Authorization": f"Basic {auth_header}"
    })

    if delete_response.status_code != 204:
        return jsonify({
            "success": False,
            "status": delete_response.status_code,
            "error": delete_response.text
        }), delete_response.status_code

    # Step 2: Purge CDN cache
    purge_response = requests.post(
        "https://api.imagekit.io/v1/files/purge",
        headers={"Authorization": f"Basic {auth_header}"},
        json={"url": file_url}
    )

    if purge_response.status_code == 200:
        return jsonify({"success": True})
    else:
        return jsonify({
            "success": False,
            "status": purge_response.status_code,
            "error": purge_response.text
        }), purge_response.status_code


if __name__ == '__main__':
    app.run(port=5000)
