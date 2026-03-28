from flask import Flask, request, jsonify, render_template
import pandas as pd
import traceback

from main import preprocess_data, predict, retrain, COLUMNS

app = Flask(__name__, template_folder='ui/templates', static_folder='ui/static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def handle_predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    try:
        # Drop any row that doesn't have all expected columns to prevent misaligned data types
        df = pd.read_csv(file, names=COLUMNS).dropna()
        total_records = len(df)
        if total_records == 0:
            return jsonify({'error': 'No valid data rows found (check file format)'})

        X, _ = preprocess_data(df)
        predictions = predict(X)
        
        attacks_count = 0
        for p in predictions:
            p_str = str(p).lower()
            # If the label does not indicate normal (either string "normal" or encoded 1 depending on LabelEncoder behavior)
            if p_str != 'normal' and p_str != '1':
                attacks_count += 1
                
        normals = total_records - attacks_count
        
        return jsonify({
            'total': total_records,
            'attacks': attacks_count,
            'normals': normals
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/retrain', methods=['POST'])
def handle_retrain():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    try:
        df = pd.read_csv(file, names=COLUMNS).dropna()
        if len(df) == 0:
            return jsonify({'error': 'No valid data rows found (check file format)'})
            
        X, y = preprocess_data(df)
        metrics = retrain(X, y)
        
        return jsonify(metrics)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
