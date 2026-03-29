import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle

# Sample dataset
data = {
    "task": [
        "reply email", "complete assignment", "watch movie",
        "prepare for exam", "clean room", "build project",
        "study for 5 hours", "buy groceries"
    ],
    "effort": [
        "quick", "long", "medium",
        "long", "medium", "long",
        "long", "quick"
    ]
}

df = pd.DataFrame(data)

X = df["task"]
y = df["effort"]

vectorizer = TfidfVectorizer()
X_vec = vectorizer.fit_transform(X)

model = LogisticRegression()
model.fit(X_vec, y)

pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("Model trained and saved!")