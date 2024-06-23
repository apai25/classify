from openai import OpenAI
import os

def transcribe_audio(audio_file: str):
    client = OpenAI()

    if not os.path.isfile(audio_file):
        raise FileNotFoundError(f"File {audio_file} not found.")

    with open(audio_file, "rb") as audio:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio,
        )
    return transcript.text
