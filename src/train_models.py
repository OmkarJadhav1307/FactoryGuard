import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from imblearn.combine import SMOTETomek
from sklearn.metrics import classification_report, f1_score, recall_score, precision_score

# --- Configuration ---
DATA_PATH = "data/feature_engineered_dataset.csv"
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

def train_pipeline():
    # 1. Load Data
    print(f"Loading engineered dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    # Drop identifier and target redundancy columns
    drop_cols = ['UDI', 'Product ID', 'Type', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    X = df.drop(columns=['Machine failure'] + [c for c in drop_cols if c in df.columns])
    y = df['Machine failure']
    
    # 2. Temporal Split (80% Train, 20% Test)
    # Important: No shuffle to maintain time-series integrity
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    print(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")
    
    # 3. Preprocessing (Scaling)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))
    print("Feature scaling complete. Scaler saved.")
    
    # 4. Class Balancing (SMOTE-Tomek for cleaner boundaries)
    print("Applying SMOTE-Tomek balancing (Strategy: 60/40 + Noise Cleaning)...")
    # SMOTETomek combines oversampling and undersampling to remove overlapping points
    smote_tomek = SMOTETomek(sampling_strategy=2/3, random_state=42)
    X_train_res, y_train_res = smote_tomek.fit_resample(X_train_scaled, y_train)
    
    print(f"Balanced training distribution:\n{y_train_res.value_counts(normalize=True)}")
    
    # 5. Train Logistic Regression (Baseline)
    print("\n--- Training Logistic Regression Baseline ---")
    lr_model = LogisticRegression(random_state=42, max_iter=1000)
    lr_model.fit(X_train_res, y_train_res)
    
    # 6. Train XGBoost (Cost-Sensitive + Optimized)
    print("\n--- Starting Enhanced XGBoost Hyperparameter Tuning ---")
    
    # Calculate scale_pos_weight: (Count of Negative / Count of Positive)
    pos_weight = np.sum(y_train == 0) / np.sum(y_train == 1)
    
    # We will search for the best pos_weight multiplier to hit the Recall goal
    xgb = XGBClassifier(
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    
    param_dist = {
        'scale_pos_weight': [pos_weight, pos_weight * 1.5, pos_weight * 2], # Testing higher weights
        'n_estimators': [300, 500, 700],
        'max_depth': [5, 7, 9, 11],
        'learning_rate': [0.01, 0.05, 0.1],
        'subsample': [0.8, 0.9, 1.0],
        'colsample_bytree': [0.8, 0.9, 1.0],
        'min_child_weight': [1, 5, 10]
    }
    
    # Optimize for F1-weighted or custom to emphasize Recall
    random_search = RandomizedSearchCV(
        xgb,
        param_distributions=param_dist,
        n_iter=35, # Aggressive effort
        scoring='recall', # Prioritizing Recall as requested
        cv=3,
        verbose=1,
        n_jobs=-1,
        random_state=42
    )
    
    random_search.fit(X_train_res, y_train_res)
    best_xgb = random_search.best_estimator_
    print(f"Best Parameters: {random_search.best_params_}")
    
    # 7. Evaluation
    def evaluate_model(model, name, X_t, y_t):
        preds = model.predict(X_t)
        report = classification_report(y_t, preds)
        print(f"\n[{name}] Evaluation Report:")
        print(report)
        return {
            'Recall': recall_score(y_t, preds),
            'F1': f1_score(y_t, preds),
            'Precision': precision_score(y_t, preds)
        }

    lr_results = evaluate_model(lr_model, "Logistic Regression", X_test_scaled, y_test)
    xgb_results = evaluate_model(best_xgb, "Tuned XGBoost", X_test_scaled, y_test)
    
    # Save the winner
    joblib.dump(best_xgb, os.path.join(MODELS_DIR, 'factory_guard_model.pkl'))
    print(f"\nChampion model (XGBoost) saved to {MODELS_DIR}/factory_guard_model.pkl")

if __name__ == "__main__":
    train_pipeline()
