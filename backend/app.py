from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from utils.hume_utils import get_hume_sentiments, get_hume_vocal_burst
from utils.anthropic import get_anthropic_response, process_transcript, get_classroom_history
from utils.audio import transcribe_audio
from utils.email import send_email
from dotenv import load_dotenv
import os
import json
import logging 

logging.basicConfig(level=logging.DEBUG)

load_dotenv()
curr_dir = os.path.dirname(os.path.abspath(__file__))

# ==== Init App ====
app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")

# ==== App Config ====
# Upload Directory
uploads_dir_path = os.path.join(curr_dir, 'uploads/')
if not os.path.exists(uploads_dir_path): 
    os.makedirs(uploads_dir_path)
app.config['UPLOAD_FOLDER'] = uploads_dir_path

# Data Directory
data_dir_path = os.path.join(curr_dir, 'data/')
if not os.path.exists(data_dir_path): 
    os.makedirs(data_dir_path)
app.config['DATA_FOLDER'] = data_dir_path


# ==== Helper Functions ====

def read_json(filepath):
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def write_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

def is_alert(input):
    return True

# ==== API ===

@app.route('/get-facial-sentiments', methods=['POST'])
def get_facial_sentiment():
    if 'video' not in request.files:
        return jsonify({"Error": "No video uploaded"}), 400
    video = request.files['video']
    
    if video.filename == '':
        return jsonify({"Error": "No selected video"}), 400
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], video.filename)
    video.save(filepath)

    pred = get_hume_sentiments(filepath)

    sentiment_to_total_score = {}
    for frame_prediction in pred[0]['results']['predictions'][0]['models']['face']['grouped_predictions'][0]['predictions']:
        for sentiment in frame_prediction['emotions']:
            sentiment_to_total_score[sentiment['name']] = sentiment_to_total_score.get(sentiment['name'], 0) + sentiment['score']

    os.remove(filepath)
    return jsonify(sentiment_to_total_score), 200

@app.route('/get-vocal-expressions', methods=['POST'])
def get_vocal_expressions():
    if 'audio' not in request.files:
        return jsonify({"Error": "No audio uploaded"}), 400
    audio = request.files['audio']
    date = request.form.get('date')

    if audio.filename == '':
        return jsonify({"Error": "No selected audio"}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], audio.filename)
    audio.save(filepath)

    pred = get_hume_vocal_burst(filepath)

    model_out_expressions = pred[0]['results']['predictions'][0]['models']['burst']['grouped_predictions'][0]['predictions'][0]['descriptions']
    expression_to_score = {item['name']: item['score'] for item in model_out_expressions}

    model_out_emotions = pred[0]['results']['predictions'][0]['models']['burst']['grouped_predictions'][0]['predictions'][0]['emotions']
    emotion_to_score = {item['name']: item['score'] for item in model_out_emotions}

    out = {
        'expressions': expression_to_score,
        'emotions': emotion_to_score
    }

    if is_alert(out):
        notifications_filepath = os.path.join(app.config['DATA_FOLDER'], 'notifications.json')
        notifications = read_json(notifications_filepath)
    
    dummy_alert = {
        'title': 'Fight Detected [CAMERA XX]',
        'description': 'Fight detected in the hallway',
        'expressions': expression_to_score, 
        'emotions': emotion_to_score,
        'top_expression': max(expression_to_score, key=expression_to_score.get),
        'top_emotion': max(emotion_to_score, key=emotion_to_score.get),
    }
    
    dummy_alert['hume_summary'] = f"It looks like we might have a safety concern. We've noticed a strong sense of {dummy_alert['top_emotion']} and a noticeable level of {dummy_alert['top_expression']}."

    transcript = transcribe_audio(filepath)
    processed_transcript = process_transcript(transcript)
    dummy_alert['ai_summary'] = get_anthropic_response(processed_transcript)

    notifications[date] = notifications.get(date, []) + [dummy_alert]

    write_json(notifications_filepath, notifications)

    os.remove(filepath)
    return 'OK', 200


@app.route('/get-summary', methods=["POST"])
def get_summary():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    audio = request.files['audio']
    
    if audio.filename == '':
        return jsonify({"error": "No selected audio file"}), 400
    
    input_audio_filepath = os.path.join(app.config['UPLOAD_FOLDER'], audio.filename)
    audio.save(input_audio_filepath)
    
    transcript = transcribe_audio(input_audio_filepath)
    processed_transcript = process_transcript(transcript)

    transcript_filepath = os.path.join(app.config['DATA_FOLDER'], 'transcript.json')
    transcript_json = read_json(transcript_filepath)

    date = request.form.get('date')
    transcript_json[date] = transcript_json.get(date, '') + processed_transcript

    write_json(transcript_filepath, transcript_json)

    summary = get_anthropic_response(transcript_json[date])
    summary_dict = json.loads(summary)

    response_data = {'date': date, 'summary': summary_dict}

    summaries_filepath = os.path.join(app.config['DATA_FOLDER'], 'summaries.json')
    summaries = read_json(summaries_filepath)

    summaries[date] = summary

    write_json(summaries_filepath, summaries)

    os.remove(input_audio_filepath)

    return jsonify(response_data), 200

@app.route('/get-summary-by-date', methods=['POST'])
def get_summary_by_date():
    date = request.form.get('date')
    summaries_filepath = os.path.join(app.config['DATA_FOLDER'], 'summaries.json')
    summaries = read_json(summaries_filepath)

    out = summaries.get(date, {'English': 'N/A', 'Math': 'N/A', 'Science': 'N/A', 'Social Studies': 'N/A'})
    return out, 200

@socketio.on("chat")
def handle_message(data):
    try:
        input = data.get('input')
        if not input: 
            emit('chat', {'answer': 'No input provided'})
            return
        
        answer_generator = get_classroom_history(input)
        answer_string = ''
        for next_answer in answer_generator:
            answer_string += next_answer
            emit('chat', {'answer': answer_string, 'done': False}, broadcast=True)
        
        emit('chat', {'answer': answer_string, 'done': True}, broadcast=True)
    except Exception as e:
        emit('chat', {'answer': str(e)})
        return


@app.route("/send-email", methods=["POST"])
def send_email():
    data = request.get_json()
    to_address = data.get('to_address')
    subject = data.get('subject')
    message = data.get('message')


    if not to_address or not subject or not message:
        return jsonify({"error": "Missing required fields"}), 400
    
    send_email(to_address, subject, message)

@app.route('/get-notifications', methods=['GET'])
def get_notifications():
    notifications_filepath = os.path.join(app.config['DATA_FOLDER'], 'notifications.json')
    notifications = read_json(notifications_filepath)

    return jsonify(notifications), 200


if __name__ == '__main__':
    socketio.run(app, debug=True, port=8080)
