"""
ML Training Script - Step 3: Model Training & Evaluation
"""

# ── Imports ──────────────────────────────────────────────────────────────────
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier
import joblib

# ── Step 1: Load Dataset ─────────────────────────────────────────────────────
df = pd.read_csv("dataset.csv")

print("=" * 60)
print("  STEP 1 — DATASET LOADED")
print("=" * 60)
print(f"  Shape : {df.shape[0]} rows × {df.shape[1]} columns")
print(f"\n  First 5 rows:")
print(df.head())

# ── Step 2: Separate Features & Label ────────────────────────────────────────
X = df.drop(columns=["label"])
y = df["label"]

print("\n" + "=" * 60)
print("  STEP 2 — FEATURES & LABEL SEPARATED")
print("=" * 60)
print(f"  X shape : {X.shape}  (features)")
print(f"  y shape : {y.shape}  (labels)")
print(f"\n  Feature columns ({len(X.columns)}):")
for col in X.columns:
    print(f"    - {col}")

# ── Step 3: Encode Categorical Columns ───────────────────────────────────────
trend_encoder = LabelEncoder()
X = X.copy()
X["trend"] = trend_encoder.fit_transform(X["trend"])

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print("\n" + "=" * 60)
print("  STEP 3 — ENCODING DONE")
print("=" * 60)
print(f"  'trend' encoded  → {list(trend_encoder.classes_)} → {list(range(len(trend_encoder.classes_)))}")
print(f"  'label' encoded  → {list(label_encoder.classes_)} → {list(range(len(label_encoder.classes_)))}")
print(f"\n  Unique encoded label values: {sorted(set(y_encoded))}")

# ── Step 4: Train / Test Split ───────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.20,
    random_state=42,
    stratify=y_encoded
)

print("\n" + "=" * 60)
print("  STEP 4 — TRAIN / TEST SPLIT DONE")
print("=" * 60)
print(f"  X_train : {X_train.shape}")
print(f"  X_test  : {X_test.shape}")
print(f"  y_train : {y_train.shape}")
print(f"  y_test  : {y_test.shape}")

print("\n" + "=" * 60)
print("  Preprocessing complete.")
print("=" * 60)

# ── Step 5: Train Model ───────────────────────────────────────────────────────
model = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
    use_label_encoder=False,
    eval_metric='mlogloss'
)
model.fit(X_train, y_train)

# ── Step 6: Predict ───────────────────────────────────────────────────────────
y_pred = model.predict(X_test)

# ── Step 7: Evaluate ──────────────────────────────────────────────────────────
acc = accuracy_score(y_test, y_pred)
report = classification_report(y_test, y_pred, target_names=label_encoder.classes_)

print("\n" + "=" * 60)
print("  STEP 5/6/7 — MODEL TRAINED & EVALUATED")
print("=" * 60)
print(f"\n  Accuracy : {acc * 100:.2f}%")
print("\n  Classification Report:")
print(report)

# ── Step 8: Save Model + Encoders ────────────────────────────────────────────
bundle = {
    "model": model,
    "trend_encoder": trend_encoder,
    "label_encoder": label_encoder
}
joblib.dump(bundle, "model.pkl")
print("\n" + "=" * 60)
print("  STEP 8 — MODEL SAVED")
print("=" * 60)
print("  File : model.pkl")
