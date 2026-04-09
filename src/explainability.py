import pandas as pd
import numpy as np
import joblib
import shap
import matplotlib.pyplot as plt
import os

# --- Configuration ---
PACK_PATH = "models/factory_guard_ensemble_pack.pkl"
DATA_PATH = "data/feature_engineered_dataset.csv"
OUTPUT_DIR = "reports/explainability"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_shap_analysis():
    print("Loading Ensemble Pack and Data...")
    pack = joblib.load(PACK_PATH)
    xgb_model = pack['xgb']
    scaler = pack['scaler']
    
    df = pd.read_csv(DATA_PATH)
    
    # Preprocessing
    drop_cols = ['UDI', 'Product ID', 'Type', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    X = df.drop(columns=['Machine failure'] + [c for c in drop_cols if c in df.columns])
    y = df['Machine failure']
    
    # For SHAP, we want a subset of the test data (last 20%)
    split_idx = int(len(df) * 0.8)
    X_test = X.iloc[split_idx:].copy()
    y_test = y.iloc[split_idx:].copy()
    
    # Scale
    X_test_scaled = scaler.transform(X_test)
    X_test_scaled_df = pd.DataFrame(X_test_scaled, columns=X.columns)
    
    # Sanitize feature names for SHAP/XGBoost (removing [, ], <)
    X_test_scaled_df.columns = [c.replace('[', '_').replace(']', '_').replace('<', '_') for c in X_test_scaled_df.columns]
    xgb_model.feature_names = list(X_test_scaled_df.columns) # Sync with model if possible or just pass array
    print("Initializing SHAP TreeExplainer for Ultra-XGBoost...")
    # TreeExplainer is extremely fast for XGBoost
    explainer = shap.TreeExplainer(xgb_model)
    
    print("Calculating SHAP values (subset for speed)...")
    # Take 200 samples for a representative summary
    sample_indices = np.random.choice(X_test_scaled_df.index, min(200, len(X_test_scaled_df)), replace=False)
    X_sample = X_test_scaled_df.loc[sample_indices]
    shap_values = explainer.shap_values(X_sample)
    
    # 1.1 Summary Plot
    print("Generating Summary Plot...")
    plt.figure(figsize=(12, 8))
    shap.summary_plot(shap_values, X_sample, show=False)
    plt.title("FactoryGuard AI: Global Feature Importance (Mission 80% Recall)")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "shap_summary_plot.png"), dpi=200)
    plt.close()
    
    # 1.2 Bar Plot (Importance)
    print("Generating Importance Bar Plot...")
    plt.figure(figsize=(10, 6))
    shap.plots.bar(explainer(X_sample), show=False)
    plt.title("Mean Absolute SHAP Impact")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "shap_importance_bar.png"), dpi=200)
    plt.close()
    
    # --- 2. Local Explainability (Specific unit) ---
    print("Generating Local Waterfall Plot for High-Risk Case...")
    
    # Find a specific case where failure was predicted (High probability)
    probs = xgb_model.predict_proba(X_test_scaled)[:, 1]
    high_risk_idx = np.argmax(probs) # Most "Failure-like" case
    
    explanation = explainer(X_test_scaled_df.iloc[[high_risk_idx]])
    
    plt.figure(figsize=(10, 6))
    shap.plots.waterfall(explanation[0], show=False)
    plt.title(f"Dynamic Diagnostic: Why Unit at idx {high_risk_idx} is high risk?")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, f"waterfall_risk_unit_{high_risk_idx}.png"), dpi=200)
    plt.close()
    
    print(f"\nSHAP Analysis Complete. Plots saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    run_shap_analysis()
