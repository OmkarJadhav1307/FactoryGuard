import pandas as pd
import numpy as np
import joblib
import os
import json
from sklearn.metrics import precision_recall_curve, f1_score
from sklearn.model_selection import train_test_split

def optimize_threshold():
    print("Loading model and data for threshold optimization...")
    DATA_PATH = "data/feature_engineered_dataset.csv"
    df = pd.read_csv(DATA_PATH)
    
    # Preprocessing identical to training
    drop_cols = ['UDI', 'Product ID', 'Type', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    X = df.drop(columns=['Machine failure'] + [c for c in drop_cols if c in df.columns])
    y = df['Machine failure']
    
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    scaler = joblib.load('models/scaler.pkl')
    X_test_scaled = scaler.transform(X_test)
    
    model = joblib.load('models/factory_guard_model.pkl')
    
    # Get probabilities
    probs = model.predict_proba(X_test_scaled)[:, 1]
    
    # Calculate Precision and Recall for many thresholds
    precision, recall, thresholds = precision_recall_curve(y_test, probs)
    
    # Calculate F1 for each threshold
    # F1 = 2 * (P * R) / (P + R)
    f1_scores = 2 * (precision * recall) / (precision + recall + 1e-10)
    
    # Find the best threshold
    best_idx = np.argmax(f1_scores)
    best_threshold = float(thresholds[best_idx])
    best_f1 = float(f1_scores[best_idx])
    
    print(f"\nOptimization Results:")
    print(f"Best Threshold: {best_threshold:.4f}")
    print(f"Max F1-Score: {best_f1:.4f}")
    print(f"Recall at Best Threshold: {recall[best_idx]:.4f}")
    print(f"Precision at Best Threshold: {precision[best_idx]:.4f}")
    
    # Save results
    os.makedirs('models', exist_ok=True)
    with open('models/optimal_threshold.json', 'w') as f:
        json.dump({
            'optimal_threshold': best_threshold,
            'max_f1': best_f1,
            'recall': float(recall[best_idx]),
            'precision': float(precision[best_idx])
        }, f, indent=4)
    
    print(f"\nSaved optimal threshold to models/optimal_threshold.json")

if __name__ == "__main__":
    optimize_threshold()
