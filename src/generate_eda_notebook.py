import nbformat as nbf
import os

def create_eda_notebook():
    nb = nbf.v4.new_notebook()

    nb['cells'] = [
        nbf.v4.new_markdown_cell("# Exploratory Data Analysis (EDA) on Engineered Features\n"
                                 "This notebook analyzes the `data/feature_engineered_dataset.csv` generated in Week 1.\n"
                                 "The goal is to understand the correlation of our rolling temporal features "
                                 "with machine failure, visualize distributions, and dry-run SMOTE to inspect synthetic data points."),
        
        nbf.v4.new_code_cell("import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n"
                             "import seaborn as sns\nfrom imblearn.over_sampling import SMOTE\n"
                             "from sklearn.decomposition import PCA\nfrom sklearn.preprocessing import StandardScaler\n"
                             "import warnings\nwarnings.filterwarnings('ignore')\n\n"
                             "plt.style.use('seaborn-v0_8-darkgrid')"),
                             
        nbf.v4.new_markdown_cell("## 1. Data Loading & Basic Inspection"),
        
        nbf.v4.new_code_cell("df = pd.read_csv('../data/feature_engineered_dataset.csv')\n"
                             "print(f'Dataset Shape: {df.shape}')\n"
                             "df.head()"),
                             
        nbf.v4.new_code_cell("failure_counts = df['Machine failure'].value_counts(normalize=True) * 100\n"
                             "print('Class Distribution (%):\\n', failure_counts)"),

        nbf.v4.new_markdown_cell("## 2. Feature Correlation Analysis\n"
                                 "Let's see which features (raw vs 1H rolling vs 8H ema) have the strongest linear correlation with `Machine failure`."),
                                 
        nbf.v4.new_code_cell("drop_cols = ['UDI', 'Product ID', 'Type', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']\n"
                             "df_numeric = df.drop(columns=drop_cols)\n"
                             "correlations = df_numeric.corr()['Machine failure'].sort_values(ascending=False)\n"
                             "print('Top 10 Positively Correlated Features:')\n"
                             "print(correlations.head(10))\n"
                             "print('\\nTop 5 Negatively Correlated Features:')\n"
                             "print(correlations.tail(5))"),
                             
        nbf.v4.new_code_cell("plt.figure(figsize=(10, 6))\n"
                             "# Exclude the target itself\n"
                             "top_corr = correlations.drop('Machine failure').head(10)\n"
                             "sns.barplot(x=top_corr.values, y=top_corr.index, palette='viridis')\n"
                             "plt.title('Top 10 Features Correlated with Machine Failure')\n"
                             "plt.xlabel('Pearson Correlation')\n"
                             "plt.show()"),
                             
        nbf.v4.new_markdown_cell("## 3. Distribution Comparison (Healthy vs. Failure)\n"
                                 "Visualizing the separation between classes for the strongest features."),
                                 
        nbf.v4.new_code_cell("features_to_plot = ['Torque [Nm]', 'Tool wear [min]_roll_mean_480', 'Air temperature [K]_ema_60']\n"
                             "\n"
                             "fig, axes = plt.subplots(1, 3, figsize=(18, 5))\n"
                             "for i, feat in enumerate(features_to_plot):\n"
                             "    if feat in df.columns:\n"
                             "        sns.kdeplot(data=df, x=feat, hue='Machine failure', fill=True, ax=axes[i], common_norm=False)\n"
                             "        axes[i].set_title(f'Distribution of {feat}')\n"
                             "plt.tight_layout()\n"
                             "plt.show()"),
                             
        nbf.v4.new_markdown_cell("## 4. SMOTE Dry-Run & Visualization\n"
                                 "We will apply SMOTE to the dataset and use PCA (Principal Component Analysis) to project the multi-dimensional sensor space into 2D. This allows us to visually inspect where the synthetic failure points are being generated."),
                                 
        nbf.v4.new_code_cell("X = df_numeric.drop(columns=['Machine failure'])\n"
                             "y = df_numeric['Machine failure']\n"
                             "smote = SMOTE(sampling_strategy=2/3, random_state=42)\n"
                             "X_res, y_res = smote.fit_resample(X, y)\n"
                             "print(f'Original target distribution: {y.value_counts().to_dict()}')\n"
                             "print(f'SMOTE target distribution: {y_res.value_counts().to_dict()}')"),
                             
        nbf.v4.new_code_cell("pca = PCA(n_components=2)\n"
                             "# PCA on original data\n"
                             "X_pca_orig = pca.fit_transform(StandardScaler().fit_transform(X))\n"
                             "# PCA on SMOTE data\n"
                             "X_pca_res = pca.transform(StandardScaler().fit_transform(X_res))\n"
                             "\n"
                             "fig, axes = plt.subplots(1, 2, figsize=(16, 6))\n"
                             "\n"
                             "sns.scatterplot(x=X_pca_orig[:,0], y=X_pca_orig[:,1], hue=y, alpha=0.5, ax=axes[0], palette=['blue', 'red'])\n"
                             "axes[0].set_title('PCA Layout - Original Data (Extreme Imbalance)')\n"
                             "\n"
                             "sns.scatterplot(x=X_pca_res[:,0], y=X_pca_res[:,1], hue=y_res, alpha=0.2, ax=axes[1], palette=['blue', 'orange'])\n"
                             "axes[1].set_title('PCA Layout - After SMOTE (Synthetic points in Orange)')\n"
                             "\n"
                             "plt.show()")
    ]

    os.makedirs('notebooks', exist_ok=True)
    nb_path = 'notebooks/eda_engineered_data.ipynb'
    nbf.write(nb, nb_path)
    print(f"Created notebook at: {nb_path}")

if __name__ == "__main__":
    create_eda_notebook()
