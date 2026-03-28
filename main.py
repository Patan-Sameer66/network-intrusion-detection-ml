import pandas as pd
import joblib

from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, f1_score

MODEL_PATH      = "NIDS_model"
TRAIN_DATA_PATH = "KDD- dataset/KDDTrain.txt"

# Expected feature columns (excludes label columns 'status' and 'level')
FEATURE_COLS = [
'service',
 'flag',
 'src_bytes',
 'dst_bytes',
 'logged_in',
 'count',
 'serror_rate',
 'srv_serror_rate',
 'same_srv_rate',
 'diff_srv_rate',
 'dst_host_srv_count',
 'dst_host_same_srv_rate',
 'dst_host_diff_srv_rate',
 'dst_host_serror_rate',
 'dst_host_srv_serror_rate']

COLUMNS = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
    'num_compromised', 'root_shell', 'su_attempted', 'num_root',
    'num_file_creations', 'num_shells', 'num_access_files', 'num_outbound_cmds',
    'is_host_login', 'is_guest_login', 'count', 'srv_count', 'serror_rate',
    'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate',
    'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
    'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
    'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate',
    'dst_host_srv_rerror_rate', 'status', 'level'
]

CATEGORICAL_COLS = ['protocol_type', 'service', 'flag']



def preprocess_data(data):
    data.columns = COLUMNS
    data = data.drop_duplicates()
    data = data.fillna(0)
    
    if 'status' in data.columns and data['status'].dtype == object:
        data['status'] = data['status'].apply(lambda x: 'normal' if x == 'normal' else 'attack')
    
    label_encoder = LabelEncoder()
    for col in ['protocol_type', 'service', 'flag', 'status']:
        if col in data.columns:
            data[col] = label_encoder.fit_transform(data[col].astype(str))

    X = data.drop(['status', 'level'], axis=1, errors='ignore')
    if 'attack' in data.columns:
        X = X.drop(['attack'], axis=1)
        
    y = data['status'] if 'status' in data.columns else None

    # Try to load scaler/normalizer from model dict to avoid data leakage
    try:
        data_dict = joblib.load(MODEL_PATH)
        if isinstance(data_dict, dict):
            if 'scaler' in data_dict:
                X_scaled = data_dict['scaler'].transform(X)
                X = pd.DataFrame(X_scaled, columns=X.columns)
            if 'normalizer' in data_dict:
                X_norm = data_dict['normalizer'].transform(X)
                X = pd.DataFrame(X_norm, columns=X.columns)
            if 'features' in data_dict:
                X = X[data_dict['features']]
            return X, y
    except Exception:
        pass

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X = pd.DataFrame(X_scaled, columns=X.columns)

    return X, y


def retrain(X,y):
    data_dict = joblib.load(MODEL_PATH)
    if isinstance(data_dict, dict) and 'model' in data_dict:
        model = data_dict['model']
    else:
        model = data_dict
        
    model.fit(X,y)
    
    if isinstance(data_dict, dict) and 'model' in data_dict:
        data_dict['model'] = model
        joblib.dump(data_dict, MODEL_PATH)
    else:
        joblib.dump(model, MODEL_PATH)
    
    y_pred = model.predict(X)
    acc = accuracy_score(y, y_pred)
    f1 = f1_score(y, y_pred, average='weighted')
    
    cv_scores = cross_val_score(model, X, y, cv=3, scoring='accuracy')
    
    return {
        "message": "Model retrained successfully",
        "accuracy": acc,
        "f1_score": f1,
        "cv_mean": cv_scores.mean(),
        "cv_std": cv_scores.std()
    }


def predict(X):
    data_dict = joblib.load(MODEL_PATH)
    if isinstance(data_dict, dict) and 'model' in data_dict:
        model = data_dict['model']
    else:
        model = data_dict
    return model.predict(X)
    