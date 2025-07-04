from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson.json_util import dumps  # handles ObjectId serialization

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient("mongodb+srv://root:root@cluster0.jt307.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['school']
collection = db['data']

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
    username = data.get('email')
    user_data = collection.find_one({'email': username})
    print('Fetching user data for:', username)
    
    if user_data:
        return dumps(user_data) 
    else:
        return jsonify({'error': 'User not found'}), 404
    
@app.route("/updatehints", methods=["POST"])
def update_hints():
    data = request.json
    email = data.get("email")
    difficulty = data.get("difficulty")
    word = data.get("word")

    if not all([email, difficulty, word]):
        return jsonify({"error": "Missing required fields"}), 400

    field_path = f"wordscramble.{difficulty}.$[entry].1"

    result = collection.update_one(
        { "email": email },
        { "$inc": { field_path: 1 } },
        array_filters=[ { "entry.0": word } ]
    )
    # print(result)

    return jsonify({
        "matched": result.matched_count,
        "modified": result.modified_count
    })


@app.route("/increment-score", methods=["POST"])
def mark_solved_and_update_score():
    data = request.json
    email = data.get("email")
    difficulty = data.get("difficulty")  # "easy", "medium", "hard"
    word = data.get("word")

    if not all([email, difficulty, word]):
        return jsonify({ "error": "Missing fields" }), 400

    is_path = f"wordscramble.{difficulty}.$[entry].2"
    score_path = f"wordscramble.{difficulty}score.score"

    # Update: set is = true and increment score
    result = collection.update_one(
        { "email": email },
        {
            "$set": { is_path: True },
            "$inc": { score_path: 1 }
        },
        array_filters=[{ "entry.0": word, "entry.2": False }]  # only if not already solved
    )

    if result.modified_count == 0:
        return jsonify({ "message": "Already solved or word not found" })

    return jsonify({
        "message": "Word marked as solved and score incremented",
        "matched": result.matched_count,
        "modified": result.modified_count
    })

@app.route("/updateVocabularyArchadeScore", methods=["POST"])
def update_vocabulary_archade_score():
    data = request.json
    email = data["email"]
    difficulty = data["difficulty"]
    word = data["word"]

    result = collection.update_one(
        {
            "email": email,
            f"vocabularyArchade.{difficulty}.wordDetails.word": word
        },
        {
            "$set": {
                f"vocabularyArchade.{difficulty}.wordDetails.$.isSolved": True
            },
            "$inc": {
                f"vocabularyArchade.{difficulty}.score": 1
            }
        }
    )

    if result.modified_count > 0:
        return jsonify({ "success": True })
    else:
        return jsonify({ "success": False, "message": "Word not found or already solved" }), 400


@app.route("/updateVocabularyBadge", methods=["POST"])
def update_vocabulary_badge():
    data = request.json
    email = data.get("email")
    badge = data.get("badge")
    level = data.get("level")

    if not all([email, badge, level]):
        return jsonify({ "success": False, "message": "Missing required fields" }), 400

    result = collection.update_one(
        { "email": email },
        { "$set": { f"vocabularyArchade.{level}.badge": badge } }
    )

    if result.modified_count > 0:
        return jsonify({ "success": True })
    else:
        return jsonify({ "success": False, "message": "User not found or badge not updated" }), 400

@app.route('/updateWordsearchScore', methods=['POST'])
def update_wordsearch_score():
    data = request.json
    email = data.get('email')
    level = data.get('level')
    score = data.get('score')
    word = data.get('word')

    if not all([email, level, word, score is not None]):
        return jsonify({"message": "Missing fields"}), 400

    # Set score and mark word as solved
    result = collection.update_one(
        { "email": email, f"wordsearch.{level}.words.word": word.upper() },
        {
            "$set": {
                f"wordsearch.{level}.score": score,
                f"wordsearch.{level}.words.$.solved": True
            }
        }
    )
    print(result)
    if result.modified_count > 0:
        return jsonify({"message": "Score and word updated successfully"})
    else:
        return jsonify({"message": "No update made — word may not exist"}), 404
    
    
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
        { "email": username },
        { "$set": { "dailyData": daily_data } },
        upsert=True
    )
    print('Update result:', result)
    
    if result.modified_count > 0 or result.upserted_id:
        return jsonify({'status': 'Daily data updated successfully'})
    else:
        return jsonify({'status': 'Failed to update daily data'}), 500
    # return jsonify({'status': 'Daily data updated successfully'})


@app.route('/students', methods=['GET'])
def get_students():
    class_arg = request.args.get('class')
    section_arg = request.args.get('section')
    print(class_arg, section_arg)

    if not class_arg or not section_arg:
        return jsonify({"error": "Please provide class and section as query parameters"}), 400

    pipeline = [
        {
            "$match": {
                "role": "student",
                "classes": class_arg,
                "sections": section_arg
            }
        },
        {
            "$project": {
                "_id": 0,
                "id": "$id",
                "username": {"$arrayElemAt": [{"$split": ["$email", "@"]}, 0]},
                "fullName": "$fullName",
                "class": {"$arrayElemAt": ["$classes", 0]},
                "section": {"$arrayElemAt": ["$sections", 0]},
                "speaking": "$speakingCompletion",
                "pronunciation": "$pronunciationCompletion",
                "vocabulary": "$vocabularyCompletion",
                "grammar": "$grammarCompletion",
                "story": "$storyCompletion",
                "reflex": "$reflexCompletion",
                "timeSpent": "$timeSpent",
                "overall": "$overall"
            }
        }
    ]

    results = list(collection.aggregate(pipeline))
    return jsonify(results)






if __name__ == '__main__':
    app.run(debug=True)
