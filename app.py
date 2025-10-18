from flask import Flask, request, jsonify
from flask_cors import CORS
from googleapiclient.discovery import build
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from scipy.special import softmax
import traceback
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the Twitter-specific sentiment model
MODEL = "cardiffnlp/twitter-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSequenceClassification.from_pretrained(MODEL)

# YouTube API setup
DEVELOPER_KEY = ""  # Replace with your actual API key
youtube = build("youtube", "v3", developerKey=DEVELOPER_KEY)

# Function to get sentiment using the Twitter-specific model
def get_sentiment(text):
    encoded_input = tokenizer(text, return_tensors='pt', truncation=True)
    output = model(**encoded_input)
    scores = output.logits.detach().numpy()[0]
    probs = softmax(scores)
    sentiment_labels = ['Negative', 'Neutral', 'Positive']
    sentiment = sentiment_labels[np.argmax(probs)]
    return sentiment

@app.route('/comments', methods=['GET'])
def get_comments():
    video_id = request.args.get('videoId')
    if not video_id:
        return jsonify({"error": "Missing videoId parameter"}), 400

    try:
        yt_req = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=20
        )
        yt_resp = yt_req.execute()

        comments_data = []
        for item in yt_resp['items']:
            txt = item['snippet']['topLevelComment']['snippet']['textDisplay']

            # Use Twitter-based sentiment analysis
            sentiment = get_sentiment(txt)

            comments_data.append({"comment": txt, "sentiment": sentiment})

        return jsonify({"comments": comments_data})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
