import boto3
import json 
import os 
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_aws import ChatBedrock

curr_dir = os.path.dirname(os.path.realpath(__file__))
data_dir_path = os.path.join(curr_dir, '../data/')
if not os.path.exists(data_dir_path): 
    os.makedirs(data_dir_path)

file_transcript_path = os.path.join(data_dir_path, 'transcript.json')
if not os.path.exists(file_transcript_path):
    with open(file_transcript_path, 'w') as f:
        json.dump({}, f)


    
def invoke_bedrock(audio_transcript: str, prompt_template: str) -> str:
    bedrock_runtime = boto3.client(
        service_name="bedrock-runtime",
        region_name="us-east-1"
    )

    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    model_kwargs = {
        "max_tokens": 2048,
        "temperature": 1.0,
        "top_k": 250,
        "top_p": 1,
        "stop_sequences": ["\n\nHuman"]
    }

    model = ChatBedrock(
        client=bedrock_runtime,
        model_id=model_id,
        model_kwargs=model_kwargs
    )

    messages = [
        ("system", prompt_template),
        ("human", audio_transcript)
    ]

    prompt = ChatPromptTemplate.from_messages(messages)

    chain = prompt | model | StrOutputParser()

    response = chain.invoke({"audio_transcript": audio_transcript})

    return response


def get_anthropic_response(audio_transcript: str) -> str:
    prompt_template = """
    You are an AI assistant that takes in a processed transcript of audio from a classroom setting and transcribes it into summarizations for parents to learn about their child's day. This is the transcript you will use: {audio_transcript}.

    The audio is a lesson from a teacher to a student. You are going to summarize the lesson and output a response that contains summaries of what the teacher taught for the four main subjects: Math, English, Science, and Social Studies. If the teacher did not mention any content relating to one of those subjects, output the response as 'n/a'.

    Every response should have the same format: {{'subject': 'summarization'}}. Ensure that the transcript is accurate and that the summary is concise. Only respond in this format. If the audio does not pertain to a classroom conversation, output {{"English": "n/a", "Math": "n/a", "Science": "n/a", "Social Studies": "n/a"}}.

    **Example 1**
    Teacher: Okay class, today we're going to be reading Othello. Can anyone tell me what we discussed last class?
    Student: We discussed the themes of jealousy and betrayal and how they relate to the characters in the play.

    AI: {{"English": "Today, the class discussed the themes of jealousy and betrayal in Othello and how they relate to the characters in the play. Your child was an active participant in class discussions and demonstrated a strong understanding of the material.", "Math": "n/a", "Science": "n/a", "Social Studies": "n/a"}}

    **Example 2**
    Teacher: Next class, make sure to read up to Chapter 5 of Othello. We will be discussing the themes of love and loyalty. Let's focus on multiplying fractions now.

    AI: {{"English": "The teacher instructed the class to read up to Chapter 5 of Othello for the next class. The class will be discussing the themes of love and loyalty. Your child is expected to read up to Chapter 5 of Othello for the next class.", "Math": "The class focused on multiplying fractions.", "Science": "n/a", "Social Studies": "n/a"}}
    """

    return invoke_bedrock(audio_transcript, prompt_template)


def process_transcript(audio_transcript: str) -> str:
    prompt_template = """You are an AI assistant that cleans up transcribed audio text.
    This is the transcript you will use: {audio_transcript}.
    
    The audio is a conversation that may include multiple speakers, background noise, and potential errors in transcript. Your job is to clean up the transcript, correct any mistakes, and make the text clear and readable.
    You should also always indicate the person speaking if there are multiple speakers in the conversation. You will only be processing audios from a classroom setting, so try and identify when the teacher is talking versus a student is talking. 

    **Example 1**
    Original: Okay class, today we're going to be reading Othello, can anyone tell me what we discussed last class. Yes, Raghav. We discussed the themes of jealousy and betrayal and how they relate to the characters in the play.
    Cleaned: Teacher: Okay class, today we're going to be reading Othello, can anyone tell me what we discussed last class. Raghav: We discussed the themes of jealousy and betrayal and how they relate to the characters in the play.
    """
    
    return invoke_bedrock(audio_transcript, prompt_template)


def get_classroom_history( question: str) -> str:
    with open(file_transcript_path, 'r') as f:
        transcript = json.load(f)


    bedrock_runtime = boto3.client(
        service_name="bedrock-runtime",
        region_name="us-east-1"
    )

    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    model_kwargs = {
        "max_tokens": 2048,
        "temperature": 1.0,
        "top_k": 250,
        "top_p": 1,
        "stop_sequences": ["\n\nHuman"]
    }

    model = ChatBedrock(
        client=bedrock_runtime,
        model_id=model_id,
        model_kwargs=model_kwargs
    )

    prompt_template = """You are an AI assistant that provides a summary of the classroom history.
    Your job is to take {transcript} and a user query {question} and provide summaries of what the child did in school that day across all subjects. Keep your responses under 2 sentences, you're just supposed to be giving a general idea. Remember, you are communicating to parents who want to know what their child is learning in school. Pretend like you are a teacher that's giving a summary to a parent, like a parent-teacher conference almost. Make sure you only answer questions relating to the subject of {question}. For example, if the user asks about math, but you do not have any data about math, then respond, "The class has not learned any new math-related content". Do not answer with a different subject.

    <special instructions> 
    Do not restate the question in your response. Keep your response concise and informal but polite. 
    </special instructions>

    **Example 1**
    Date: 2023-09-22
    Summaries: {{'2023-09-22': {{"English": "Today, the class discussed the themes of jealousy and betrayal in Othello and how they relate to the characters in the play. In math, we went over multiplying fractions and taking derivatives. Your child was an active participant in class discussions", "Math": "Today, the class focused on multiplying fractions and taking derivatives. Your child was an active participant in class discussions", "Science": "n/a", "Social Studies": "n/a"}}}}
    Question: What did my child do in school today?
    AI: 
    Today, your child discussed the themes of jealousy and betrayal in Othello and how they relate to the characters in the play. In math, they went over multiplying fractions and taking derivatives. Your child was an active participant in class discussions.
    """


    messages = [
        ("system", prompt_template),
        ("human", question)
    ]

    prompt = ChatPromptTemplate.from_messages(messages)

    chain = prompt | model | StrOutputParser()

    response = ''

    for chunk in chain.stream({'question': question, 'transcript': transcript}):
        print("Chunk: ", chunk)
        yield chunk 
        response += chunk
    print(response)
        
    return response