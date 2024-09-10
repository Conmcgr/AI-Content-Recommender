from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pymongo
import random
import torch
from transformers import BertTokenizer, BertModel
from data_collection import make_embedding

def update_average_video_embedding(avg_vid_embedding, total_ratings, new_video, new_rating):
    new_rating = int(new_rating)
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
        "channel title": 0.12,
        "tags" : 0.12,
        "category" : 0.12,
     }

    for video in videos:
        video_data = {
            "video id": video.get('video_id', []),
            "title": video.get('title_embedded', []),
            "description" : video.get('description_embedded', []),
            "channel title": video.get('channel_title_embedded', []),
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
    avg_vid = user["average video"]

    if avg_vid == {}:
        return []
    
    similarities = []
    video_weights = {
        "title": 0.35,
        "description" : 0.35,
        "channel title": 0.15,
        "category" : 0.15,
     }

    for video in videos:
        video_data = {
            "video id": video.get('video_id', []),
            "title": video.get('title_embedded', []),
            "description" : video.get('description_embedded', []),
            "channel title": video.get('channel_title_embedded', []),
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

def get_top_3(video_collection, user):

    videos = video_collection.find({})
    interest_list = interest_video_similarity(user, videos, 20)

    if user["total_videos"] == 0:
        video_ids = [video_id for sim, video_id in interest_list[:3]]
        return video_ids

    videos = video_collection.find({})
    ratings_list = ratings_video_similarity(user, videos, 20)

    interest_dict = {video_id: sim for sim, video_id in interest_list}
    ratings_dict = {video_id: sim for sim, video_id in ratings_list}

    # Find common video IDs using intersection
    common_video_ids = list(set(interest_dict.keys()).intersection(set(ratings_dict.keys())))

    # Initialize the final result list
    final_video_ids = []

    if len(common_video_ids) == 3:
        # Exactly 3 common videos, return them directly
        final_video_ids = common_video_ids
    elif len(common_video_ids) > 3:
        # Calculate cumulative similarity for common videos
        cumulative_similarities = [(video_id, interest_dict[video_id] + ratings_dict[video_id]) for video_id in common_video_ids]

        # Sort by cumulative similarity in descending order
        cumulative_similarities.sort(key=lambda x: x[1], reverse=True)

        # Select the top 3 videos with the highest cumulative similarity
        final_video_ids = [video_id for video_id, _ in cumulative_similarities[:3]]
    else:
        # Less than 3 common videos, add them first
        final_video_ids = common_video_ids

        # Normalize similarities for the remaining videos in each list
        remaining_interest = [(sim, video_id) for sim, video_id in interest_list if video_id not in final_video_ids]
        remaining_ratings = [(sim, video_id) for sim, video_id in ratings_list if video_id not in final_video_ids]

        # Normalize the similarities in both lists
        remaining_interest_normalized = [(sim / np.max([sim for sim, _ in remaining_interest]), video_id) for sim, video_id in remaining_interest]
        remaining_ratings_normalized = [(sim / np.max([sim for sim, _ in remaining_ratings]), video_id) for sim, video_id in remaining_ratings]

        # Combine the remaining lists and sort by normalized similarity
        combined_remaining = remaining_interest_normalized + remaining_ratings_normalized
        combined_remaining.sort(reverse=True, key=lambda x: x[0])

        # Add the highest normalized video IDs until the final_video_ids list has 3 items
        for _, video_id in combined_remaining:
            if video_id not in final_video_ids:
                final_video_ids.append(video_id)
            if len(final_video_ids) == 3:
                break

    return final_video_ids