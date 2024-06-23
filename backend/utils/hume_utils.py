from dotenv import load_dotenv
from hume import HumeBatchClient
from hume.models.config import FaceConfig, BurstConfig # type: ignore
import os
import json

load_dotenv()

api_key = os.environ['HUME_API_KEY']
client = HumeBatchClient(api_key)

def get_hume_sentiments(filepath):
    config = FaceConfig()
    job = client.submit_job(None, [config], files=[filepath])
    
    job.await_complete()
    predictions = job.get_predictions()
    with open('test.json', 'w') as f:
        json.dump(predictions, f)
    return predictions

def get_hume_vocal_burst(filepath):
    config = BurstConfig()
    job = client.submit_job(None, [config], files=[filepath])

    job.await_complete()
    predictions = job.get_predictions()

    return predictions

if __name__ == '__main__':
    FILENAME = 'video-1.mp4'
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    input_filepath = os.path.join(curr_dir, f'../uploads/{FILENAME}')
    pred = get_hume_vocal_burst(input_filepath)

    with open('test.json', 'w') as f:
        json.dump(pred, f)