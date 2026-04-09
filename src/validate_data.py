import pandas as pd
import numpy as np

def validate_lineage(df_path):
    print(f"Starting validation for {df_path}...")
    df = pd.read_csv(df_path)
    
    # 1. Check for NaNs
    nan_count = df.isnull().sum().sum()
    if nan_count > 0:
        print(f"FAILED: Found {nan_count} missing values.")
    else:
        print("PASSED: No missing values found.")

    # 2. Basic Leakage Check:
    # We verify that no future information or the target itself was used in feature names.
    # Note: Logic-based leakage detection is harder, but we check for common pitfalls.
    target_col = 'Machine failure'
    correlations = df.corr(numeric_only=True)[target_col].sort_values(ascending=False)
    
    print("\nTarget Correlations (Top 5):")
    print(correlations.head(5))
    
    # Check if a lag/roll feature has near-perfect correlation (implies leakage)
    suspicious = correlations[(correlations > 0.99) & (correlations.index != target_col)]
    # Filter out secondary failure modes if they are present in the dataset
    failure_modes = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    suspicious = [idx for idx in suspicious.index if idx not in failure_modes]

    if len(suspicious) > 0:
        print(f"WARNING: Suspiciously high correlation in {suspicious}. Check for leakage!")
    else:
        print("PASSED: No obvious high-correlation leakage detected.")

    # 3. Time Variance Check:
    # Ensure that rolling stats vary over time (not constant)
    test_col = 'Air temperature [K]_roll_mean_60'
    if df[test_col].std() == 0:
        print(f"FAILED: {test_col} is constant. Rolling window logic might be broken.")
    else:
        print(f"PASSED: Variability detected in temporal features.")

    print("\nValidation Complete.")

if __name__ == "__main__":
    validate_lineage("data/feature_engineered_dataset.csv")
