import os
import hashlib
import re
from datetime import timedelta
from flask import Flask, jsonify, request, session
from dotenv import load_dotenv
from supabase import create_client
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True
)

CORS(
    app,
    supports_credentials=True,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "https://dein-frontend.vercel.app"
            ]
        }
    }
)
app.secret_key = os.getenv("SECRET_KEY", "supersecret")
app.permanent_session_lifetime = timedelta(minutes=90)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

@app.route("/api/register", methods=["POST"])
def register():
    try:
        if "user" in session:
            return jsonify({"success": True, "user": session["user"], "message": "Already logged in."}), 200

        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        existing_user = supabase.table("User").select("Email").eq("Email", hashlib.sha256(email.encode()).hexdigest()).execute()

        if existing_user.data:
            return jsonify({"success": False, "error": "Email already registered"}), 409

        response = supabase.table("User").insert({
            "Username": username,
            "Email": hashlib.sha256(email.encode()).hexdigest(),
            "Password": hashlib.sha256(password.encode()).hexdigest()
        }).execute()

        user = response.data[0]
        session.permanent = True
        session["user"] = {"email": user["Email"], "username": user["Username"]}

        return jsonify({"success": True, "user": user}), 201
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        if "user" in session:
            return jsonify({"success": True, "user": session["user"], "message": "Already logged in."}), 200

        email = request.form.get("email")
        password = request.form.get("password")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("User").select("*").eq("Email", hashlib.sha256(email.encode()).hexdigest()).eq("Password", hashlib.sha256(password.encode()).hexdigest()).execute()

        if not response.data:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        user = response.data[0]
        session.permanent = True
        session["user"] = {"email": user["Email"], "username": user["Username"]}

        return jsonify({"success": True, "user": user}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/session-check", methods=["GET"])
def session_check():
    try:
        if "user" in session:
            return jsonify({"success": True, "user": session["user"]}), 200

        return jsonify({"success": False, "error": "No active session"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/logout", methods=["POST"])
def logout():
    try:
        session.pop("user", None)
        return jsonify({"success": True, "message": "Logged out successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/users/<username>", methods=["GET"])
def get_user(username):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        regex = re.escape(username) if len(username) > 3 else r"\m" + re.escape(username)
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("User").select("*").filter("Username","imatch",regex).execute()

        return jsonify({"success": True, "User": response.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/users", methods=["DELETE"])
def delete_user():
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.table("User").delete().eq("Email", session["user"]["email"]).execute()
        session.pop("user", None)

        return jsonify({"success": True, "message": "User deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets", methods=["POST"])
def add_set():
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        data = request.json
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        user_id = supabase.table("User").select("UserID").eq("Email", session["user"]["email"]).execute().data[0]["UserID"]
        data["UserID"] = int(user_id)
        response = supabase.table("LearningSet").insert(data).execute()

        return jsonify({"success": True, "Set": response.data}), 201
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets", methods=["GET"])
def get_client_sets():
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("*, User!inner()").eq("User.Email", session["user"]["email"]).execute()

        if not response.data:
            return jsonify({"success": False, "error": "No sets found."}), 404

        return jsonify({"success": True, "sets": response.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/users/<int:user_id>/sets", methods=["GET"])
def get_sets(user_id):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("*, User!inner()").eq("User.UserID", user_id).execute()

        if not response.data:
            return jsonify({"success": False, "error": "No sets found."}), 404

        return jsonify({"success": True, "sets": response.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets/name/<set_title>", methods=["GET"])
def get_sets_name(set_title):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        regex = re.escape(set_title) if len(set_title) > 1 else r"\m" + re.escape(set_title)
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("*").filter("Title","imatch",regex).execute()

        if not response.data:
            return jsonify({"success": False, "error": "No sets found."}), 404

        return jsonify({"success": True, "sets": response.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets/<int:set_id>", methods=["GET"])
def get_set(set_id):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("*").eq("LearningSetID", set_id).execute()

        if not response.data:
            return jsonify({"success": False, "error": "No sets found."}), 404

        return jsonify({"success": True, "set": response.data[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets/<int:set_id>", methods=["POST"])
def update_set(set_id):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("LearningSetID, User!inner()").eq("LearningSetID", set_id).eq("User.Email", session["user"]["email"]).execute()

        if not response.data:
            return jsonify({"success": False, "error": "Forbidden access."}), 403

        data = request.json
        response = supabase.table("LearningSet").update(data).eq("LearningSetID", set_id).execute()

        return jsonify({"success": True, "set": response.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets/<int:set_id>", methods=["DELETE"])
def delete_set(set_id):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("LearningSetID, User!inner()").eq("LearningSetID", set_id).eq("User.Email", session["user"]["email"]).execute()

        if not response.data:
            return jsonify({"success": False, "error": "Forbidden access."}), 403

        supabase.table("LearningSet").delete().eq("LearningSetID", set_id).execute()

        return jsonify({"success": True, "message": "Deleted Set"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets/<int:set_id>/cards", methods=["POST"])
def add_cards(set_id):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("LearningSetID, User!inner()").eq("LearningSetID", set_id).eq("User.Email", session["user"]["email"]).execute()

        if not response.data:
            return jsonify({"success": False, "error": "Forbidden access."}), 403

        supabase.table("Card").delete().eq("LearningSetID", set_id).execute()
        data = request.json

        if data:
            for c in data:
                c["LearningSetID"] = set_id

            response = supabase.table("Card").insert(data).execute()

        return jsonify({"success": True, "cards": response.data}), 201
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets/<int:set_id>/cards", methods=["PATCH"])
def update_cards(set_id):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        data = request.json
        learned_cards = data["cards"] if "cards" in data else []
        score = data["score"] if "score" in data else None
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        progress = supabase.table("User").select("Progress").eq("Email", session["user"]["email"]).execute().data[0]["Progress"] or []
        total = supabase.table("Card").select("*", count="exact").eq("LearningSetID", set_id).execute().count

        for i in progress:
            if i["LearningSetID"] == set_id:
                if score:
                    i["score"] = score

                i["cards"] = list(set(i["cards"] + learned_cards))
                if len(i["cards"]) >= total:
                    i["cards"] = []
                break
        else:
            progress.append({"LearningSetID": set_id, "cards": learned_cards, "score": score if score else 0.00})

        response = supabase.table("User").update({"Progress": progress}).eq("Email", session["user"]["email"]).execute()

        return jsonify({"success": True, "User": response.data[0]}), 201
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/sets/<int:set_id>/cards", methods=["GET"])
def get_cards(set_id):
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("Card").select("*").eq("LearningSetID", set_id).execute()

        return jsonify({"success": True, "cards": response.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/allsets", methods=["GET"])
def get_all_sets():
    try:
        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("LearningSet").select("*").execute()

        return jsonify({"success": True, "sets": response.data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
