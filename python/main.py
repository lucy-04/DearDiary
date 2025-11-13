from flask import Flask, request, jsonify
import joblib
import os

app = Flask(__name__)

# Load model from the same directory as this file
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "text_emotion.pkl")

try:
    pipe_lr = joblib.load(open(MODEL_PATH, "rb"))
except Exception as e:
    # If model fails to load, keep pipe_lr as None and return 500 on predict
    pipe_lr = None
    load_error = str(e)


@app.route('/', methods=['GET'])
def health():
    """Health check / basic info endpoint."""
    ok = pipe_lr is not None
    resp = {"status": "ok" if ok else "error", "model_loaded": ok}
    if not ok:
        resp["error"] = load_error
    return jsonify(resp), (200 if ok else 500)


@app.route('/predict', methods=['POST'])
def predict():
    """Accepts JSON {"text": "..."} and returns prediction and probabilities.

    Response JSON:
      { "prediction": str, "probabilities": {label: prob, ...}, "text": str }
    """
    if pipe_lr is None:
        return jsonify({"error": "model not loaded"}), 500

    if not request.is_json:
        return jsonify({"error": "Request must be application/json"}), 400

    data = request.get_json()
    if not isinstance(data, dict) or "text" not in data:
        return jsonify({"error": "JSON body must contain 'text' field"}), 400

    text = data.get("text")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "'text' must be a non-empty string"}), 400

    sample_text = [text]
    try:
        pred = pipe_lr.predict(sample_text)[0]
        probs_arr = pipe_lr.predict_proba(sample_text)[0]
        # If the pipeline has classes_ attribute, map probabilities to labels
        labels = getattr(pipe_lr, "classes_", None)
        if labels is not None:
            probabilities = {str(label): float(prob) for label, prob in zip(labels, probs_arr)}
        else:
            probabilities = [float(p) for p in probs_arr]

        return jsonify({"prediction": str(pred), "probabilities": probabilities, "text": text}), 200
    except Exception as e:
        return jsonify({"error": "prediction failed", "detail": str(e)}), 500


if __name__ == '__main__':
    # Run with Flask's built-in server for local testing. The user mentioned using uv (pipx/uv?)
    # For production use a WSGI server such as gunicorn or uvicorn (if using ASGI adapter).
    app.run(host='0.0.0.0', port=5000, debug=True)
    
    