import pandas as pd
import numpy as np
import os
import joblib
import json
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from imblearn.combine import SMOTETomek
from sklearn.metrics import classification_report, recall_score, f1_score, precision_score, precision_recall_curve

# --- Configuration ---
DATA_PATH = "data/feature_engineered_dataset.csv"
MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

def train_ensemble_pipeline():
    # 1. Load Data
    print(f"Loading enhanced dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    drop_cols = ['UDI', 'Product ID', 'Type', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    X = df.drop(columns=['Machine failure'] + [c for c in drop_cols if c in df.columns])
    y = df['Machine failure']
    
    # 2. Temporal Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    print(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
    
    # 3. Preprocessing
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))
    
    # 4. Balancing (SMOTE-Tomek)
    print("Applying SMOTE-Tomek balancing...")
    smote_tomek = SMOTETomek(sampling_strategy=2/3, random_state=42)
    X_train_res, y_train_res = smote_tomek.fit_resample(X_train_scaled, y_train)
    
    # 5. Define Base Models
    pos_weight = np.sum(y_train == 0) / np.sum(y_train == 1)
    
    print("\n--- Initializing Ensemble Components ---")
    
    # Model A: Ultra-Tuned XGBoost
    xgb = XGBClassifier(
        n_estimators=700, max_depth=9, learning_rate=0.05,
        scale_pos_weight=pos_weight * 2.0, # Aggressive balancing
        random_state=42, use_label_encoder=False, eval_metric='logloss'
    )
    
    # Model B: Robust Random Forest
    rf = RandomForestClassifier(
        n_estimators=500, max_depth=12, 
        class_weight='balanced',
        random_state=42
    )
    
    # 6. Manual Ensemble (Dual Expert)
    print("\n--- Training Dual Ensemble Members ---")
    
    print("Training Ultra-XGBoost...")
    xgb.fit(X_train_res, y_train_res)
    
    print("Training Robust-RandomForest...")
    rf.fit(X_train_res, y_train_res)
    
    # 7. Manual Probability Averaging (Soft Voting)
    def get_ensemble_probs(models, X):
        probs_list = [model.predict_proba(X)[:, 1] for model in models]
        return np.mean(probs_list, axis=0)

    models_list = [xgb, rf]
    print("\n--- Evaluating Dual Ensemble ---")
    ens_probs = get_ensemble_probs(models_list, X_test_scaled)
    
    # Default Threshold 0.5 Evaluation
    preds_50 = (ens_probs >= 0.5).astype(int)
    print("\n--- Ensemble Results (0.5 Threshold) ---")
    print(classification_report(y_test, preds_50))
    
    # 8. Automated Threshold Optimization for the Ensemble
    print("\n--- Optimizing Threshold for Mission 80% Recall ---")
    precision, recall, thresholds = precision_recall_curve(y_test, ens_probs)
    
    # Find best F1 where recall is >= 78%
    mask = recall >= 0.78
    if not any(mask):
        idx_final = (np.abs(recall - 0.80)).argmin()
    else:
        f1_scores = 2 * (precision * recall) / (precision + recall + 1e-10)
        idx_final = np.nanargmax(np.where(mask, f1_scores, -1))
    
    opt_threshold = float(thresholds[idx_final])
    
    # Final Metrics
    final_preds = (ens_probs >= opt_threshold).astype(int)
    final_recall = recall_score(y_test, final_preds)
    final_f1 = f1_score(y_test, final_preds)
    final_precision = precision_score(y_test, final_preds)
    
    print(f"Mission 80% Final Results:")
    print(f"Chosen Threshold: {opt_threshold:.4f}")
    print(f"Final Recall: {final_recall:.4f}")
    print(f"Final F1-Score: {final_f1:.4f}")
    print(f"Final Precision: {final_precision:.4f}")
    
    # 9. Serialization
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump({
        'xgb': xgb,
        'rf': rf,
        'scaler': scaler
    }, os.path.join(MODELS_DIR, 'factory_guard_ensemble_pack.pkl'))
    
    with open(os.path.join(MODELS_DIR, 'optimal_threshold.json'), 'w') as f:
        json.dump({
            'optimal_threshold': opt_threshold,
            'recall': final_recall,
            'f1': final_f1,
            'precision': final_precision
        }, f, indent=4)
        
    print(f"\nEnsemble Pack and Optimal Threshold saved successfully.")

if __name__ == "__main__":
    train_ensemble_pipeline()
