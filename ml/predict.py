"""
Prediction Service - Flask API
POST /predict → { prediction: "optimal" | "overtraining" | "undertraining" }
"""

import joblib
import pandas as pd
from flask import Flask, request, jsonify

# ── Load Model + Encoders ─────────────────────────────────────────────────────
bundle        = joblib.load("model.pkl")
model         = bundle["model"]
trend_encoder = bundle["trend_encoder"]
label_encoder = bundle["label_encoder"]

# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

FEATURES = [
    "cpi", "loadScore", "performanceScore", "efficiencyScore",
    "trend", "compliance", "weeklySessions", "avgDuration",
    "fatigueIndex", "stressScore", "recoveryScore"
]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        # Validate all required fields are present
        missing = [f for f in FEATURES if f not in data]
        if missing:
            return jsonify({"error": f"Missing required fields: {missing}"}), 400

        # Build row in EXACT order as training with defensive defaults
        try:
            ordered_features = []
            defaults = {
                "trend": "stable",
                "compliance": 0,
                "weeklySessions": 0,
                "avgDuration": 0,
                "fatigueIndex": 5,
                "stressScore": 50,
                "recoveryScore": 50,
                "cpi": 100,
                "loadScore": 100,
                "performanceScore": 100,
                "efficiencyScore": 100
            }

            for f in FEATURES:
                val = data.get(f, defaults.get(f))
                
                # Handle nulls
                if val is None:
                    val = defaults.get(f)

                # Encode "trend" — must match training
                if f == "trend":
                    try:
                        val = trend_encoder.transform([str(val)])[0]
                    except:
                        val = trend_encoder.transform(["stable"])[0]
                
                ordered_features.append(float(val) if f != "trend" else val)

            # Predict using a simple list of lists for better stability
            encoded_pred = model.predict([ordered_features])[0]
            label        = label_encoder.inverse_transform([encoded_pred])[0]

            return jsonify({
                "status": "success",
                "prediction": str(label)
            })

        except ValueError as ve:
            return jsonify({"status": "error", "message": f"Validation error: {str(ve)}"}), 400

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    print("Starting prediction service on http://localhost:5001")
    print("Endpoint: POST /predict")
    app.run(debug=False, port=5001)
