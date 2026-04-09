import pandas as pd
import numpy as np
import os

class SensorDataProcessor:
    def __init__(self, raw_path: str):
        self.raw_path = raw_path
        self.df = None

    def ingest_data(self):
        """Load data and handle basic cleaning."""
        if not os.path.exists(self.raw_path):
            raise FileNotFoundError(f"Raw data not found at {self.raw_path}")
        
        self.df = pd.read_csv(self.raw_path)
        print(f"Loaded {len(self.df)} rows from {self.raw_path}")
        
        # Interpolate missing values if any
        self.df.interpolate(method='linear', inplace=True)
        self.df.ffill(inplace=True)
        self.df.bfill(inplace=True)
        return self

    def add_temporal_features(self):
        """Add lag and rolling statistics features."""
        if self.df is None:
            raise ValueError("Data not ingested. Call ingest_data() first.")

        # Features to apply temporal engineering on
        sensor_cols = ['Air temperature [K]', 'Process temperature [K]', 
                       'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']
        
        # 1. Lag Features (t-1, t-2)
        print("Generating lag features...")
        for col in sensor_cols:
            self.df[f'{col}_lag1'] = self.df[col].shift(1)
            self.df[f'{col}_lag2'] = self.df[col].shift(2)

        # 2. Rolling Window Statistics (Mean & EMA)
        # Windows: 1hr (60m), 4hr (240m), 8hr (480m)
        windows = [60, 240, 480]
        print("Generating rolling statistics...")
        for col in sensor_cols:
            for window in windows:
                # Rolling Mean
                self.df[f'{col}_roll_mean_{window}'] = self.df[col].rolling(window=window).mean()
                # Exponential Moving Average (EMA)
                self.df[f'{col}_ema_{window}'] = self.df[col].ewm(span=window, adjust=False).mean()

        # Drop rows with NaN resulting from shifts/rolling to ensure data integrity
        # We drop 480 rows (max window) to ensure all features are populated
        initial_len = len(self.df)
        self.df.dropna(inplace=True)
        print(f"Dropped {initial_len - len(self.df)} rows due to window alignment.")
        
    def add_advanced_features(self):
        """Add non-linear interactions and rate-of-change descriptors."""
        print("Generating advanced interaction features...")
        
        # 1. Power Proxy (Torque * Speed) - high load indicator
        self.df['Power_Proxy'] = self.df['Torque [Nm]'] * self.df['Rotational speed [rpm]']
        
        # 2. Thermal Stress (Process Temp * Air Temp)
        self.df['Thermal_Stress'] = self.df['Process temperature [K]'] * self.df['Air temperature [K]']
        
        # 3. Temp Delta
        self.df['Temp_Delta'] = self.df['Process temperature [K]'] - self.df['Air temperature [K]']
        
        # 4. Tool Wear Efficiency (Wear per Torque unit)
        self.df['Wear_Efficiency'] = self.df['Tool wear [min]'] / (self.df['Torque [Nm]'] + 1)
        
        # 5. Rate of Change (Current vs 1H Avg)
        # These help detect anomalies/spikes
        self.df['Torque_Diff_1H'] = self.df['Torque [Nm]'] - self.df['Torque [Nm]_roll_mean_60']
        self.df['Speed_Diff_1H'] = self.df['Rotational speed [rpm]'] - self.df['Rotational speed [rpm]_roll_mean_60']
        self.df['Temp_Diff_1H'] = self.df['Process temperature [K]'] - self.df['Process temperature [K]_roll_mean_60']
        
        return self

    def save_engineered_data(self, output_path: str):
        """Save the processed dataset."""
        if self.df is None:
            raise ValueError("No data to save.")
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        self.df.to_csv(output_path, index=False)
        print(f"Engineered dataset saved to {output_path}")

if __name__ == "__main__":
    # Define paths
    RAW_DATA = "data/ai4i_predictive_maintenance.csv"
    OUTPUT_DATA = "data/feature_engineered_dataset.csv"

    # Execute Pipeline
    processor = SensorDataProcessor(RAW_DATA)
    (processor
     .ingest_data()
     .add_temporal_features()
     .add_advanced_features()
     .save_engineered_data(OUTPUT_DATA))
