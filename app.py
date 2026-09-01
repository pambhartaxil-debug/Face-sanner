from flask import Flask, request, jsonify, send_from_directory
import os
import random
import time

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/scan', methods=['POST'])
def scan_face():
    data = request.json
    
    if not data or 'image' not in data:
        return jsonify({"error": "No image provided"}), 400
    
    # Here you would typically decode the base64 image (data['image'])
    # and pass it to a face recognition library like OpenCV or dlib.
    
    # Simulating processing delay
    time.sleep(1.5)
    
    # Mocking a recognition result.
    # In a real app, this logic depends on whether a known face was found.
    is_recognized = random.choice([True, False])
    
    if is_recognized:
        return jsonify({
            "name": "Jane Doe",
            "confidence": f"{random.randint(85, 99)}%",
            "status": "Access Granted"
        })
    else:
        return jsonify({
            "name": "Unknown",
            "confidence": "0%",
            "status": "Face not recognized"
        })

if __name__ == '__main__':
    # Start the Flask development server on port 8080
    app.run(host='0.0.0.0', port=8080, debug=True)
