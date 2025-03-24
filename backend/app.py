import os
import hashlib
from flask import Flask, jsonify, request, session
from dotenv import load_dotenv
from supabase import create_client
from flask_cors import CORS
from datetime import timedelta

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.getenv("SECRET_KEY", "supersecret")
app.permanent_session_lifetime = timedelta(minutes=30)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


@app.route("/login", methods=["POST"])
def login():
    if "user" in session:
        return jsonify({"success": True, "user": session["user"], "message": "Already logged in."}), 200
    try:
        email = request.form.get("email")
        password = request.form.get("password")

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = (
            supabase.table("User")
            .select("*")
            .eq("Email", hashlib.sha256(email.encode()).hexdigest())
            .eq("Password", hashlib.sha256(password.encode()).hexdigest())
            .execute()
        )

        if response.data:
            user = response.data[0]
            session.permanent = True
            session["user"] = {"email": user["Email"], "username": user["Username"]}
            return jsonify({"success": True, "user": user}), 200
        return jsonify({"success": False, "error": "Invalid credentials"}), 401
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/register", methods=["POST"])
def register():
    if "user" in session:
        return jsonify({"success": True, "user": session["user"], "message": "Already logged in."}), 200
    try:
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        existing_user = (
            supabase.table("User")
            .select("Email")
            .eq("Email", hashlib.sha256(email.encode()).hexdigest())
            .execute()
        )

        if existing_user.data:
            return jsonify({"success": False, "error": "Email already registered"}), 409

        response = (
            supabase.table("User")
            .insert({
                "Username": username,
                "Email": hashlib.sha256(email.encode()).hexdigest(),
                "Password": hashlib.sha256(password.encode()).hexdigest()
            })
            .execute()
        )

        user = response.data[0]
        session.permanent = True
        session["user"] = {"email": user["Email"], "username": user["Username"]}
        return jsonify({"success": True, "user": user}), 201
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/sets", methods=["POST"])
def add_set():
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        data = request.json

        user_id = (
            supabase.table("User")
            .select("UserID")
            .eq("Email", session["user"]["email"])
            .execute()
        )

        data["UserID"] = int(user_id.data[0]["UserID"])

        response = (
            supabase.table("LearningSet")
            .insert(data)
            .execute()
        )

        return jsonify({"success": True, "Set": response.data}), 201
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500



@app.route("/users/<user_id>/sets", methods=["GET"])
def get_sets(user_id):
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        response = (
            supabase.table("LearningSet")
            .select("*, User!inner()")
            .eq("User.UserID", int(user_id))
            .execute()
        )

        if not response.data:
            return jsonify({"success": False, "error": "No sets found."}), 404

        return jsonify({"success": True, "sets": response.data}), 200
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/sets", methods=["GET"])
def get_client_sets():
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        response = (
            supabase.table("LearningSet")
            .select("*, User!inner()")
            .eq("User.Email", session["user"]["email"])
            .execute()
        )

        if not response.data:
            return jsonify({"success": False, "error": "No sets found."}), 404

        return jsonify({"success": True, "sets": response.data}), 200
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/sets/<set_id>", methods=["GET"])
def get_set(set_id):
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        response = (
            supabase.table("LearningSet")
            .select("*")
            .eq("LearningSetID", set_id)
            .execute()
        )

        if not response.data:
            return jsonify({"success": False, "error": "No sets found."}), 404

        return jsonify({"success": True, "sets": response.data[0]}), 200
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/sets/<set_id>", methods=["DELETE"])
def delete_set(set_id):
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        response = (
            supabase.table("LearningSet")
            .select("LearningSetID, User!inner()")
            .eq("User.Email", session["user"]["email"])
            .eq("LearningSetID", set_id)
            .execute()
        )

        if not response.data:
            return jsonify({"success": False, "error": "Forbidden access."}), 403

        response = (
            supabase.table("LearningSet")
            .delete()
            .eq("LearningSetID", set_id)
            .execute()
        )


        return jsonify({"success": True, "Deleted Set": response.data}), 200
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/sets/<set_id>/cards", methods=["POST"])
def add_cards(set_id):
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        response = (
            supabase.table("LearningSet")
            .select("LearningSetID, User!inner()")
            .eq("User.Email", session["user"]["email"])
            .eq("LearningSetID", set_id)
            .execute()
        )

        if not response.data:
            return jsonify({"success": False, "error": "Forbidden access."}), 403

        supabase.table("Card").delete().eq("LearningSetID", set_id).execute()

        data = request.json

        for i in data:
            i["LearningSetID"] = set_id

        response = (
            supabase.table("Card")
            .insert(data)
            .execute()
        )

        return jsonify({"success": True, "cards": response.data}), 201
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/sets/<set_id>/cards", methods=["GET"])
def get_cards(set_id):
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        if "user" not in session:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        cards = (
            supabase.table("Card")
            .select("*")
            .eq("LearningSetID", set_id)
            .execute()
        )

        if not cards.data:
            return jsonify({"success": False, "error": "Data not found."}), 404

        return jsonify({"success": True, "cards": cards.data}), 200
    except Exception:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


@app.route("/session-check", methods=["GET"])
def session_check():
    if "user" in session:
        return jsonify({"success": True, "user": session["user"]}), 200
    return jsonify({"success": False, "error": "No active session"}), 401


if __name__ == "__main__":
    app.run()
