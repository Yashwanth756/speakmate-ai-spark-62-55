from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson.json_util import dumps  # handles ObjectId serialization

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient("mongodb+srv://root:root@cluster0.jt307.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['school']
collection = db['userData']

# Optional: Route to insert activityLog
@app.route('/insertActivityLog', methods=['POST', 'GET'])
def insert_activity_log():
    activity_log = [
        { "date": "2025-05-20", "module": "Vocabulary", 'activity': "Learned 5 new words", 'score': 85 },
        { "date": "2025-05-20", "module": "Grammar", 'activity': "Completed passive voice exercise", 'score': 78 },
        { "date": "2025-05-19", "module": "Speaking", 'activity': "Practiced introductions", 'score': 82 },
        { "date": "2025-05-19", "module": "Story", 'activity': "Created a short story", 'score': 90 },
        { "date": "2025-05-18", "module": "Pronunciation", 'activity': "Practiced vowel sounds", 'score': 75 },
        { "date": "2025-05-17", "module": "Reflex", 'activity': "Completed basic challenge", 'score': 65 },
        { "date": "2025-05-17", "module": "Grammar", 'activity': "Practiced using articles", 'score': 88 },
        { "date": "2025-05-16", "module": "Vocabulary", 'activity': "Reviewed 10 words", 'score': 92 }
    ]

    result = collection.update_one(
        { "_id": "yashwanth71208@gmail.com" },
        { "$set": { "activityLog": activity_log } },
        upsert=True
    )
    print('Activity log inserted/updated:', result)
    return jsonify({'status': 'Activity log inserted/updated'})

# Login Route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('email')
    password = data.get('password')

    user = collection.find_one({'email': username, 'password': password})
    
    print('Login attempt by:', username)
    if user:
        return jsonify({'success': True, 'message': 'Login successful', 'id': user['id'], 'email': user['email'], 'fullName': user['fullName'], 'role': user['role'], 'classes': user['classes'], 'sections': user['sections']})
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password'})

# Get user data
@app.route('/getUserData', methods=['POST'])
def get_user_data():
    data = request.get_json()
    username = data.get('username')
    user_data = collection.find_one({'_id': username})
    
    if user_data:
        return dumps(user_data) 
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/updateDailyData', methods=['POST'])
def update_daily_data():
    data = request.get_json()
    username = data.get('username')
    daily_data = data.get('dailyData')
    print('Updating daily data for:', username)
    print('Daily data:', daily_data)
    # return jsonify({'status': 'Daily data update endpoint reached'})

    if not username or not daily_data:
        return jsonify({'error': 'Username and dailyData are required'}), 400

    result = collection.update_one(
        { "_id": username },
        { "$set": { "dailyData": daily_data } },
        upsert=True
    )
    print('Update result:', result)
    
    if result.modified_count > 0 or result.upserted_id:
        return jsonify({'status': 'Daily data updated successfully'})
    else:
        return jsonify({'status': 'Failed to update daily data'}), 500
    # return jsonify({'status': 'Daily data updated successfully'})


if __name__ == '__main__':
    app.run(debug=True)
