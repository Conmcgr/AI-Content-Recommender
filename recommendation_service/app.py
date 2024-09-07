from flask import Flask, request, jsonify
from pymongo import MongoClient
from model import get_top_3
from bson.objectid import ObjectId
from datetime import datetime
from bson import json_util

app = Flask(__name__)

client = MongoClient("mongodb://localhost:27017/")
db = client['sparetime_database']
video_collection = db['videos']
users_collection = db['users']
queue_colection = db['rating_queue']

@app.route('/api/top3', methods=['GET'])
def get_top_3_videos():
    user_id = request.headers.get('userId')
    if not user_id:
        return jsonify({"error": "User ID not provided"}), 400
    user = users_collection.find_one({ "_id": ObjectId(user_id) })
    if not user:
        return jsonify({"error": user_id + " not found"}), 404
    
    top_3_video_ids = get_top_3(video_collection, user)
    print(f"Returning top 3 video IDs: {top_3_video_ids}")
    return jsonify({"top3VideoIds": top_3_video_ids})

@app.route('/api/rate_video', methods=['POST'])
def rate_video():
    user_id = request.headers.get('userId')
    video_id = request.json['videoId']
    rating = request.json['rating']
    user = users_collection.find_one({"_id": user_id})
    video = video_collection.find_one({"video_id": video_id})
    if not user or not video:
        return jsonify({"error": "User or video not found"}), 404
    new_avg, new_total = update_average_video_embedding(user['average_video'], user['total_ratings'], video, rating)
    users_collection.update_one({"_id": user_id}, {"$set": {"average_video": new_avg, "total_ratings": new_total}})
    return jsonify({"message": "Rating updated successfully"})

@app.route('/api/video_info', methods=['GET'])
def video_info():
    video_id = request.args.get('videoId')
    video = video_collection.find_one({"video_id": video_id})
    if not video:
        return jsonify({"error": "Video not found"}, 404)
    return jsonify(video)

@app.route('/api/add_to_queue', methods=['POST'])
def add_to_queue():
    user_id = request.headers.get('userId')
    video_id = request.json['videoId']
    user = users_collection.find_one({ "_id": ObjectId(user_id) })
    video = video_collection.find_one({"video_id": video_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not video:
        return jsonify({"error": "Video not found"}), 404
    queue_colection.insert_one({"user_id": user_id, "video": video, "timestamp": datetime.now()})
    
    return jsonify({"message": "Video added to queue successfully"})

@app.route('/api/get_queue', methods=['GET'])
def get_queue():
    user_id = request.headers.get('userId')
    user = users_collection.find_one({ "_id": ObjectId(user_id) })
    if not user:
        return jsonify({"error": "User not found"}, 404)
    videos = list(queue_colection.find({"user_id": user_id}).sort("timestamp", 1))
    simplified_videos = [{"video_id": v["video"]["video_id"], "title": v["video"]["title"]} for v in videos]
    return jsonify(simplified_videos)

@app.route('/api/remove_from_queue', methods=['POST'])
def remove_from_queue():
    video_info = request.json['video']
    video = queue_colection.find_one({"video": video_info})
    if not video:
        return jsonify({"error": "Video not found"}), 404
    queue_colection.delete_one({"video": video})
    return jsonify({"message": "Video removed from queue successfully"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)