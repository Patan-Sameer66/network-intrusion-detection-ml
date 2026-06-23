# NIDS Shield — Network Intrusion Detection System

An AI-powered Network Intrusion Detection System built with Flask and scikit-learn. Upload raw KDD-format network traffic files to instantly classify connections as **normal** or **attack**, and retrain the model on new labelled data without touching any code.

---

## Features

- **Predict** — drag & drop a CSV/TXT traffic capture and get attack vs. normal counts with a live progress bar
- **Retrain** — upload labelled data to fine-tune the stacking classifier in-browser; accuracy, F1, and cross-validation metrics are reported back
- **Stacking Classifier** — Random Forest + Decision Tree + KNN base learners with Logistic Regression as the meta-model (~99.89% accuracy on KDD Cup test set)
- Clean single-page UI with no external JS frameworks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask |
| ML | scikit-learn (RF, DT, KNN, LR, StackingClassifier) |
| Data | pandas, numpy, joblib |
| Frontend | HTML5, CSS3, Vanilla JS (ES6) |

---

## Model Performance

Trained on the **KDD Cup 1999** dataset (binary classification: `normal` vs `attack`).

| Model | Accuracy | F1 Score |
|---|---|---|
| Random Forest | 99.87% | 99.87% |
| Decision Tree | 99.83% | 99.83% |
| KNN | 99.52% | 99.52% |
| Logistic Regression | 95.28% | 95.28% |
| SVC | 98.29% | 98.29% |
| **Stacking (final)** | **99.89%** | **99.89%** |

Cross-validation (5-fold) std: ±0.00023

---

## Project Structure

```
mini_projet_NIDS/
├── app.py               # Flask routes (/predict, /retrain)
├── main.py              # Preprocessing, predict(), retrain() helpers
├── model_training.py    # Offline training script (produces NIDS_model)
├── NIDS_model           # Saved stacking classifier (joblib)
├── KDD- dataset/
│   ├── KDDTrain.txt
│   └── KDDTest.txt
└── ui/
    ├── templates/index.html
    └── static/
        ├── style.css
        └── script.js
```

---

## Getting Started

### Prerequisites

```bash
Python >= 3.9
```

### Install dependencies

```bash
pip install flask pandas scikit-learn joblib matplotlib seaborn
```

### Run the app

```bash
python app.py
```

Open `http://localhost:5000` in your browser.

---

## Usage

### Predict

1. Go to the **Predict Attacks** card.
2. Drag & drop (or browse) a `.csv` or `.txt` file in KDD format (no header row).
3. Click **Analyse File** — results show total records, attacks found, normal traffic, and attack rate.

### Retrain

1. Go to the **Retrain Model** card.
2. Upload a labelled KDD-format file (must include a `status` column).
3. Click **Retrain Model** — the updated model is saved to disk and metrics are displayed.

### Data Format

Files must follow the [KDD Cup 1999 feature schema](http://kdd.ics.uci.edu/databases/kddcup99/kddcup99.html) — 43 columns, no header, comma-separated:

```
duration, protocol_type, service, flag, src_bytes, dst_bytes, ..., status, level
```

---

## Retrain from Scratch

To retrain the base model on a fresh KDD dataset:

```bash
# Place KDDTrain+.txt in the project root, then:
python model_training.py
```

This runs feature importance selection, compares 6 classifiers, builds the stacking model, and saves it to `NIDS_model`.

---

## Dataset

This project uses the **KDD Cup 1999** dataset, a standard benchmark for network intrusion detection research.

- Source: [UCI KDD Cup 1999](http://kdd.ics.uci.edu/databases/kddcup99/)
- ~125,000 training records, 43 features per connection
- Binary label: `normal` / `attack`

---

## License

MIT
