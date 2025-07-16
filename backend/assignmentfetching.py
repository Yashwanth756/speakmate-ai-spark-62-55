
@app.route("/student-assignment-status", methods=["POST"])
def student_assignment_status():
    data = request.json
    student_email = data.get("studentEmail")
    assignment_id = data.get("assignmentId")

    if not student_email or not assignment_id:
        return jsonify({"error": "Missing studentEmail or assignmentId"}), 400

    # 1. Find student
    student = collection.find_one({"email": student_email, "role": "student"})
    if not student:
        return jsonify({"error": "Student not found"}), 404

    # 2. Find teacher who owns the assignment
    teacher = collection.find_one({
        "role": "teacher",
        "assignments.id": assignment_id
    })
    if not teacher:
        return jsonify({"error": "Assignment not found"}), 404

    # 3. Extract assignment
    assignment = next(
        a for a in teacher["assignments"]
        if a["id"] == assignment_id
    )
    assignment_type = assignment["type"]
    metadata = assignment["metadata"]
    target_class = assignment["targetClass"]
    target_section = assignment["targetSection"]

    # 4. Check student class/section match
    if target_class not in student.get("classes", []) or target_section not in student.get("sections", []):
        return jsonify({"error": "Student not in target class/section"}), 400

    # 5. Check progress
    total_items = 0
    completed_items = 0

    if assignment_type == "word_search":
        words = metadata.get("searchWords", [])
        for w in words:
            difficulty = w["difficulty"]
            student_words = student.get("wordsearch", {}).get(difficulty, {}).get("words", [])
            match = next((sw for sw in student_words if sw["word"] == w["word"]), None)
            if match and match.get("solved"):
                completed_items += 1
            total_items += 1

    elif assignment_type == "vocabulary_builder":
        words = metadata.get("vocabularyWords", [])
        for w in words:
            difficulty = w["difficulty"]
            arcade_level = {"easy": "beginner", "medium": "intermediate", "hard": "advanced"}[difficulty]
            student_words = student.get("vocabularyArchade", {}).get(arcade_level, {}).get("wordDetails", [])
            match = next((sw for sw in student_words if sw["word"] == w["word"]), None)
            if match and match.get("isSolved"):
                completed_items += 1
            total_items += 1

    elif assignment_type == "word_scramble":
        words = metadata.get("scrambleWords", [])
        for w in words:
            difficulty = w["difficulty"]
            student_list = student.get("wordscramble", {}).get(difficulty, [])
            match = next((item for item in student_list if item[0] == w["word"]), None)
            if match and match[2]:  # third index is completion flag
                completed_items += 1
            total_items += 1

    # 6. Calculate percentage
    percentage = (completed_items / total_items * 100) if total_items else 0

    return jsonify({
        "assignmentId": assignment_id,
        "studentEmail": student_email,
        "totalItems": total_items,
        "completedItems": completed_items,
        "percentage": round(percentage, 2)
    })