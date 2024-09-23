from googleapiclient.discovery import build
from dotenv import load_dotenv
import os
import pymongo
import random
import torch
from transformers import BertTokenizer, BertModel
import re

load_dotenv()

api_key = os.getenv("YOUTUBE_API_KEY")

youtube = build('youtube', 'v3', developerKey=api_key)

#Set up a random seed for encoding
random_seed = 42
random.seed(random_seed)
 
# Set a random seed for PyTorch (for GPU as well)
torch.manual_seed(random_seed)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(random_seed)

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
bert_model = BertModel.from_pretrained('bert-base-uncased')

#Make MongoDB connection
client = pymongo.MongoClient("mongodb://localhost:27017/")

db = client['sparetime_database']
video_collection = db['videos']

def make_youtube_request(search_params):
    request_params = {
        'part': 'snippet',
        'q': search_params['search_string'],
        'type': 'video',
        'maxResults': search_params['num_results'],
        'order' : 'viewCount'
    }

    if 'channel_id' in search_params:
        request_params['channelId'] = search_params['channel_id']

    request = youtube.search().list(**request_params)
    response = request.execute()
    
    return response

def make_embedding(text):
    if(isinstance(text, str)):
        text_input = [text]
    elif(isinstance(text, list)):
        text_input = [', '.join(text)]
    else:
        print(type(text), text)
        raise ValueError('Invalid input')

    # Tokenize and encode the example sentence
    encoding = tokenizer.batch_encode_plus(
        text_input,
        padding=True,
        truncation=True,
        return_tensors='pt',
        add_special_tokens=True
    )

    input_ids = encoding['input_ids']
    attention_mask = encoding['attention_mask']

    # Generate embeddings for the example sentence
    with torch.no_grad():
        outputs = bert_model(input_ids, attention_mask=attention_mask)
        embedding = outputs.last_hidden_state.mean(dim=1)

    return embedding

def duration_to_seconds(duration):
    pattern = re.compile(r'PT(\d+M)?(\d+S)?')
    match = pattern.match(duration)

    if not match:
        return 0

    minutes = int(match.group(1)[:-1]) if match.group(1) else 0
    seconds = int(match.group(2)[:-1]) if match.group(2) else 0
    
    total_seconds = minutes * 60 + seconds
    return total_seconds

def store_metadata(metadata, search_tag):
    for item in metadata['items']:
        video_id = item['id']['videoId']
        
        existing_video = video_collection.find_one({'video_id': video_id})
        
        if existing_video:
            print(f"Video with ID {video_id} already exists. Skipping insertion.")
            continue

        vid_info_request = youtube.videos().list(part="snippet,contentDetails", id=video_id)
        more_vid_metadata = vid_info_request.execute()
        
        if 'items' not in more_vid_metadata or not more_vid_metadata['items']:
            print(f"Could not retrieve additional metadata for video ID {video_id}. Skipping.")
            continue
        
        more_details = more_vid_metadata['items'][0]
        
        tags = more_details['snippet'].get('tags', [])

        video_data = {
            'video_id': video_id,
            'title': item['snippet']['title'],
            'title_embedded': make_embedding(item['snippet']['title']).tolist(),
            'description': more_details['snippet'].get('description', item['snippet']['description']),
            'description_embedded': make_embedding(more_details['snippet'].get('description', item['snippet']['description'])).tolist(),
            'published_at': item['snippet']['publishedAt'],
            'channel_title': item['snippet']['channelTitle'],
            'channel_title_embedded': make_embedding(item['snippet']['channelTitle']).tolist(),
            'channel_id': item['snippet']['channelId'],
            'thumbnails': item['snippet']['thumbnails'],
            'tags': tags,
            'tags_embedded': [] if not tags else make_embedding(tags).tolist(),
            'category': search_tag,
            'category_embedded': make_embedding(search_tag).tolist(),
            'duration': duration_to_seconds(more_details['contentDetails'].get('duration', 'Unknown')),
            'definition': more_details['contentDetails'].get('definition', 'Unknown'),
            'dimension': more_details['contentDetails'].get('dimension', 'Unknown'),
            'licensed_content': more_details['contentDetails'].get('licensedContent', False),
            'default_audio_language': more_details['snippet'].get('defaultAudioLanguage', 'Unknown')
        }

        video_collection.insert_one(video_data)
        print(f'inserted video: {video_id}')

def make_entry(searches):
    for search in searches:
        try:
            response = make_youtube_request(search)
            store_metadata(response, search['search_string'])
        except Exception as e:
            print(f"Error processing search: {search['search_string']}. Error: {str(e)}")

initial_searches = [
    {'search_string': 'machine learning transformers', 'num_results': 5, 'chanel_id': 'UCYO_jab_esuFRV4b17AJtAw', 'chanel_name': '3blue1brown'}, 
    {'search_string': 'linear algebra', 'num_results': 5, 'chanel_id': 'UCYO_jab_esuFRV4b17AJtAw', 'chanel_name': '3blue1brown'}, 
    {'search_string': 'convolutional neural networks and computer vision', 'num_results': 5, 'chanel_id': 'UCYO_jab_esuFRV4b17AJtAw', 'chanel_name': '3blue1brown'}, 
    {'search_string': 'machine learning transformers', 'num_results': 5, 'chanel_id': 'UCYO_jab_esuFRV4b17AJtAw', 'chanel_name': '3blue1brown'},
    {'search_string': 'Machine Learning Basics', 'num_results': 10},
    {'search_string': 'AI for Beginners', 'num_results': 10},
    {'search_string': 'Understanding Neural Networks', 'num_results': 10},
    {'search_string': 'Deep Learning Explained', 'num_results': 10},
    {'search_string': 'ML Algorithms Tutorial', 'num_results': 10},
    {'search_string': 'How AI Works', 'num_results': 10},
    {'search_string': 'Ethics in AI', 'num_results': 10},
    {'search_string': 'AI in Healthcare', 'num_results': 10},
    {'search_string': 'Latest Trends in AI', 'num_results': 10},
    {'search_string': 'AI for Fun Projects', 'num_results': 10},
    {'search_string': 'Top Machine Learning Books', 'num_results': 10},
    {'search_string': 'Beginner Coding Projects with AI', 'num_results': 10},
    {'search_string': 'Quantum Machine Learning', 'num_results': 10},
    {'search_string': 'AI vs Machine Learning', 'num_results': 10},
    {'search_string': 'Data Science with AI', 'num_results': 10},
    {'search_string': 'Best AI Software Tools', 'num_results': 10},
    {'search_string': 'AI in Self-Driving Cars', 'num_results': 10},
    {'search_string': 'AI in Video Games', 'num_results': 10},
    {'search_string': 'AI for Creative Applications', 'num_results': 10},
    {'search_string': 'The Future of AI', 'num_results': 10},
    {'search_string': 'Stock Market Basics', 'num_results': 10},
    {'search_string': 'How to Start Investing', 'num_results': 10},
    {'search_string': 'Understanding Bonds and Stocks', 'num_results': 10},
    {'search_string': 'Investing for Beginners', 'num_results': 10},
    {'search_string': 'How to Build a Stock Portfolio', 'num_results': 10},
    {'search_string': 'Day Trading Strategies', 'num_results': 10},
    {'search_string': 'Mutual Funds vs ETFs', 'num_results': 10},
    {'search_string': 'Cryptocurrency Investing', 'num_results': 10},
    {'search_string': 'Investing in Real Estate', 'num_results': 10},
    {'search_string': 'Retirement Planning Investments', 'num_results': 10},
    {'search_string': 'Dividend Investing Strategies', 'num_results': 10},
    {'search_string': 'How to Analyze Stocks', 'num_results': 10},
    {'search_string': 'Technical Analysis for Stocks', 'num_results': 10},
    {'search_string': 'Investing in Gold and Silver', 'num_results': 10},
    {'search_string': 'Investing for Financial Freedom', 'num_results': 10},
    {'search_string': 'Building Wealth through Investing', 'num_results': 10},
    {'search_string': 'Index Funds for Beginners', 'num_results': 10},
    {'search_string': 'Investing in the Stock Market', 'num_results': 10},
    {'search_string': 'Investing in Startups', 'num_results': 10},
    {'search_string': 'Green Investing Trends', 'num_results': 10},
    {'search_string': 'Fun Ways to Save and Invest', 'num_results': 10},
    {'search_string': 'Easy Cooking Recipes for Beginners', 'num_results': 10},
    {'search_string': 'Gourmet Cooking Made Simple', 'num_results': 10},
    {'search_string': '10-Minute Meals', 'num_results': 10},
]

second_searches = [
    {'search_string': 'Reinforcement Learning in Games', 'num_results': 10}, 
    {'search_string': 'Bayesian Statistics', 'num_results': 10}, 
    {'search_string': 'Natural Language Processing Overview', 'num_results': 10}, 
    {'search_string': 'AI for Robotics', 'num_results': 10}, 
    {'search_string': 'Advanced Machine Learning Concepts', 'num_results': 10},
    {'search_string': 'Generative AI Explained', 'num_results': 10},
    {'search_string': 'AI for Game Development', 'num_results': 10},
    {'search_string': 'Data Augmentation Techniques', 'num_results': 10},
    {'search_string': 'AI in Finance', 'num_results': 10},
    {'search_string': 'AI in Education', 'num_results': 10},
    {'search_string': 'Fairness in Machine Learning', 'num_results': 10},
    {'search_string': 'AI in Cybersecurity', 'num_results': 10},
    {'search_string': 'AI in Drug Discovery', 'num_results': 10},
    {'search_string': 'AI for Creativity and Arts', 'num_results': 10},
    {'search_string': 'AI-Powered Personal Assistants', 'num_results': 10},
    {'search_string': 'Intro to AI Ethics', 'num_results': 10},
    {'search_string': 'AI in Agriculture', 'num_results': 10},
    {'search_string': 'AI for Smart Cities', 'num_results': 10},
    {'search_string': 'AI in Legal Tech', 'num_results': 10},
    {'search_string': 'Impact of AI on Jobs', 'num_results': 10},
    {'search_string': 'AI-Powered Healthcare Diagnostics', 'num_results': 10},
    {'search_string': 'AI in Autonomous Vehicles', 'num_results': 10},
    {'search_string': 'AI for Smart Homes', 'num_results': 10},
    {'search_string': 'AI for Environmental Monitoring', 'num_results': 10},
    {'search_string': 'Beginner Finance Courses', 'num_results': 10},
    {'search_string': 'Value Investing Basics', 'num_results': 10},
    {'search_string': 'Economic Indicators Explained', 'num_results': 10},
    {'search_string': 'Stock Market Psychology', 'num_results': 10},
    {'search_string': 'How to Analyze Company Financials', 'num_results': 10},
    {'search_string': 'Hedge Funds vs Mutual Funds', 'num_results': 10},
    {'search_string': 'Crypto Trading Strategies', 'num_results': 10},
    {'search_string': 'Investment Risk Management', 'num_results': 10},
    {'search_string': 'Real Estate Investing for Beginners', 'num_results': 10},
    {'search_string': 'Financial Independence through Real Estate', 'num_results': 10},
    {'search_string': 'Dividend Growth Investing', 'num_results': 10},
    {'search_string': 'Options Trading for Beginners', 'num_results': 10},
    {'search_string': 'Forex Trading Basics', 'num_results': 10},
    {'search_string': 'Analyzing Market Cycles', 'num_results': 10},
    {'search_string': 'Passive Investing Strategies', 'num_results': 10},
    {'search_string': 'Startup Investing for Beginners', 'num_results': 10},
    {'search_string': 'Sustainable Investing Strategies', 'num_results': 10},
    {'search_string': 'How to Make Homemade Pizza', 'num_results': 10},
    {'search_string': 'International relations and diplomacy', 'num_results': 10},
    {'search_string': 'How political campaigns work', 'num_results': 10},
    {'search_string': 'Political corruption around the world', 'num_results': 10},
    {'search_string': 'Political satire and comedy', 'num_results': 10},
    {'search_string': 'Politics of climate change', 'num_results': 10},
    {'search_string': 'Comparative politics in different countries', 'num_results': 10},
    {'search_string': 'Role of lobbying in politics', 'num_results': 10},
    {'search_string': 'Impact of social movements on politics', 'num_results': 10},
    {'search_string': 'Political polarization', 'num_results': 10},
    {'search_string': 'Geopolitics of energy', 'num_results': 10} 
]

third_searches = [
    {'search_string': 'Interesting TedX Talks', 'num_results': 400, 'channel_name': 'TEDx', 'chanel_id': 'UCAuUUnT6oDeKwE6v1NGQxug'},
    {'search_string': 'Interesting Ted Talks', 'num_results': 400, 'channel_name': 'TED', 'chanel_id': 'CsT0YIqwnpJCM-mx7-gSA4Q"'},
    {'search_string': 'Best 3blue1brown Videos', 'num_results': 200, 'chanel_id': 'UCYO_jab_esuFRV4b17AJtAw', 'chanel_name': '3blue1brown'},  
]

fourth_searches = [
    {'search_string': 'Veritasium', 'num_results': 200, 'channel_name': 'Veritasium', 'chanel_id': 'UCHnyfMqiRRG1u-2MsSQLbXA'},
    {'search_string': 'vsauce1', 'num_results': 100, 'channel_name': 'vsauce1', 'chanel_id': 'UC6nSFpj9HTCZ5t-N3Rm3-HA'},
    {'search_string': 'MarkRober', 'num_results': 100, 'channel_name': 'MarkRober', 'chanel_id': 'UCY1kMZp36IQSyNx_9h4mpCg'}  
]