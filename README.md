# Driver Drowsiness Detection

This project uses deep learning (CNN) to detect whether a driver is drowsy or alert by classifying images of eyes as open or closed. The model is trained on a dataset of eye images and can be integrated with a real-time webcam feed in future stages.

---

## 🧠 Tech Stack

- **Language**: Python
- **Libraries**:
  - TensorFlow / Keras
  - OpenCV
  - NumPy, Matplotlib
  - scikit-learn (optional for metrics)
- **Dataset**: Open Eyes and Closed Eyes images (2,000 each)

---

## 📁 Project Structure

```
driver-drowsiness-detection/
├── dataset/                 # Contains train/test folders after split
│   ├── train/
│   │   ├── Open/
│   │   └── Closed/
│   └── test/
│       ├── Open/
│       └── Closed/
├── model/                  # Saved trained model
│   └── drowsiness_model.h5
├── notebooks/
│   └── train_model.ipynb   # Training notebook
├── utils/                  # Utility scripts (to be added)
├── split_dataset.py        # Script to split raw data into train/test
├── main.py                 # Future file for real-time detection
├── requirements.txt        # Python dependencies
└── README.md               # You're here
```

---

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/driver-drowsiness-detection.git
cd driver-drowsiness-detection
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Dataset Setup

- Ensure you have a dataset of images structured as:

```
EyeDataset/
├── Open/
│   └── image1.jpg ...
└── Closed/
    └── image1.jpg ...
```

- The dataset used here is from kaggle (link-"https://www.kaggle.com/datasets/prasadvpatil/mrl-dataset")
- Update the paths in `split_dataset.py` to point to your dataset.
- Run the script:

```bash
python split_dataset.py
```

This will create the `dataset/train/` and `dataset/test/` directories with properly split images.

### 4. Train the Model

Open the notebook:

```bash
jupyter notebook notebooks/train_model.ipynb
```

Run through the cells to train and save the CNN model.

---

## 💾 Model Output

- The trained model will be saved to:

```
model/drowsiness_model.h5
```

---

## 🔜 Next Steps / Future Work

- Real-time eye detection using webcam with OpenCV
- Use of Mediapipe for better face/eye localization
- Integration with alert system (audio/visual)
- Deploy using Flask or Streamlit for demo

---

## 👤 Author

- Suyash Chouksey

---

## 📜 License

This project is open-source and free to use for academic/non-commercial purposes.

