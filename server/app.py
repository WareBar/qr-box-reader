from flask import Flask, request, jsonify
import cv2
import numpy as np

app = Flask(__name__)
detector = cv2.QRCodeDetector()


def try_decode(img):
    data, _, _ = detector.detectAndDecode(img)
    return data


@app.post("/decode")
def decode():
    f = request.files.get("image")
    if not f:
        return jsonify(error="no image"), 400

    img = cv2.imdecode(np.frombuffer(f.read(), np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return jsonify(error="bad image"), 400

    # White border ("quiet zone") helps detection when the box is tight
    img = cv2.copyMakeBorder(img, 40, 40, 40, 40, cv2.BORDER_CONSTANT, value=(255, 255, 255))

    # Try original, then upscaled, then grayscale+threshold
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    attempts = [
        img,
        cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC),
        cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
    ]
    for a in attempts:
        data = try_decode(a)
        if data:
            return jsonify(url=data)

    return jsonify(error="no QR detected"), 404


if __name__ == "__main__":
    app.run(port=5000)
