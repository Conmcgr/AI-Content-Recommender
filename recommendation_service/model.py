from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pymongo
import random
import torch
from transformers import BertTokenizer, BertModel
from data_collection import make_embedding
import math

def update_average_video_embedding(avg_vid_embedding, total_ratings, new_video, new_rating):
    new_rating = float(new_rating) - 4.5
    total_ratings += new_rating

    feature_map = {'title': 'title_embedded',
    'description': 'description_embedded',
    'channel_title': 'channel_title_embedded',
    'category': 'category_embedded'}

    #Make this check that the avg_vid_embedding is empty
    is_empty = False
    for feature in avg_vid_embedding:
        if feature != '_id' and len(avg_vid_embedding[feature]) == 0:
            is_empty = True

    if is_empty:
        for feature in avg_vid_embedding:
            if feature != '_id':
                avg_vid_embedding[feature] = (np.array(new_video[feature_map[feature]]) * new_rating).tolist()
    else:
        for feature in avg_vid_embedding:
            if feature != '_id':
                old_emb = np.array(avg_vid_embedding[feature])
                new_emb = np.array(new_video[feature_map[feature]]) * new_rating
                new_avg = (old_emb * total_ratings + new_emb) / (total_ratings + 1)
                avg_vid_embedding[feature] = new_avg.tolist()

    return [avg_vid_embedding, total_ratings]

def interest_video_similarity(user, videos, num_vids):
    if user["interests"] == []:
        return []
    
    interest_embedding = make_embedding(user["interests"])
    similarities = []
    video_weights = {
        "title": 0.32,
        "description" : 0.32,
        "channel_title": 0.12,
        "tags" : 0.12,
        "category" : 0.12,
     }

    for video in videos:
        video_data = {
            "video id": video.get('video_id', []),
            "title": video.get('title_embedded', []),
            "description" : video.get('description_embedded', []),
            "channel_title": video.get('channel_title_embedded', []),
            "tags" : video.get('tags_embedded', []),
            "category" : video.get('category_embedded', [])
            }

        weighted_sum_similarity = 0
        total_weight = 0 

        for feature in video_weights:
            if len(video_data[feature]) > 0:
                video_feature_emb = torch.tensor(video_data[feature]).reshape(1, -1)
                similarity = cosine_similarity(interest_embedding, video_feature_emb)
                weighted_sum_similarity += video_weights[feature] * similarity[0][0]
                total_weight += video_weights[feature]

        if total_weight > 0:
            normalized_similarity = weighted_sum_similarity / total_weight
            similarities.append((normalized_similarity, video_data["video id"]))
    
    similarities.sort(reverse = True)
    return similarities[:num_vids]
     

def ratings_video_similarity(user, videos, num_vids):
    avg_vid = user["average_video"]

    if avg_vid == {}:
        return []
    
    similarities = []
    video_weights = {
        "title": 0.35,
        "description" : 0.35,
        "channel_title": 0.15,
        "category" : 0.15,
     }

    for video in videos:
        video_data = {
            "video id": video.get('video_id', []),
            "title": video.get('title_embedded', []),
            "description" : video.get('description_embedded', []),
            "channel_title": video.get('channel_title_embedded', []),
            "category" : video.get('category_embedded', [])
            }

        weighted_sum_similarity = 0
        total_weight = 0 

        for feature in video_weights:
            if len(video_data[feature]) > 0:
                video_feature_emb = torch.tensor(video_data[feature]).reshape(1, -1)
                avg_video_feature_emb = torch.tensor(avg_vid[feature]).reshape(1, -1)
                similarity = cosine_similarity(avg_video_feature_emb, video_feature_emb)
                weighted_sum_similarity += video_weights[feature] * similarity[0][0]
                total_weight += video_weights[feature]

        if total_weight > 0:
            normalized_similarity = weighted_sum_similarity / total_weight
            similarities.append((normalized_similarity, video_data["video id"]))
    
    similarities.sort(reverse = True)
    return similarities[:num_vids]

def get_top_3(video_collection, users_collection, user, duration):
    tolerance = 150
    target_duration = duration*60

    videos = list(video_collection.find({
        "video_id": {"$nin": user["videos_seen"]},
        "duration_in_seconds": {
            "$gte": target_duration - tolerance, 
            "$lte": target_duration + tolerance
        }
    }))
    if user['total_videos'] == 0:
        print('here')
        top_3 = [video_id for similarity, video_id in interest_video_similarity(user, videos, 3)]
        users_collection.update_one({"_id": user["_id"]}, {"$set": {"videos_seen": top_3}})
        return top_3
    
    interest_list = interest_video_similarity(user, videos, 20)
    ratings_list = ratings_video_similarity(user, videos, 20)

    total_rated = user["total_videos"]
    bias_factor = 1 - math.exp(-0.80 * total_rated)

    combined_list = []
    for video_id in set([vid for _, vid in interest_list] + [vid for _, vid in ratings_list]):
        interest_sim = next((sim for sim, vid in interest_list if vid == video_id), 0)
        ratings_sim = next((sim for sim, vid in ratings_list if vid == video_id), 0)
        
        combined_sim = (1 - bias_factor) * interest_sim + bias_factor * ratings_sim
        combined_list.append((combined_sim, video_id))

    combined_list.sort(reverse=True, key=lambda x: x[0])
    top_3 = [video_id for _, video_id in combined_list[:3]]
    
    user["videos_seen"].extend(top_3)
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"videos_seen": user["videos_seen"]}})

    return top_3
