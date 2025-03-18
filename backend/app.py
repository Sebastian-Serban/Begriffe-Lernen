import os
import hashlib
from flask import Flask, jsonify, request, session
from flask_session import Session
from dotenv import load_dotenv
from supabase import create_client
from flask_cors import CORS


load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Später bei deployment anpassen
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "supersecret")
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = "./flask_session"
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


Session(app)


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Endpoints

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
            session["user"] = {"email": user["Email"], "username": user["Username"]}
            session.modified = True
            return jsonify({"success": True, "user": user}), 200
        else:
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
        session["user"] = {"email": user["Email"], "username": user["Username"]}
        session.modified = True
        return jsonify({"success": True, "user": user}), 201

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
    app.run(debug=True)
