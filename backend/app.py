import os
import hashlib
from flask import Flask, jsonify, request, session
from flask_session import Session
from dotenv import load_dotenv
from supabase import create_client
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

load_dotenv()

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "supersecret")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


@app.before_request
def track_session():
    print(f"Before Request - Session Data: {session}")


@app.route("/login", methods=["POST"])
def get_user():
    if session.get("username"):
        print("yasss")
        return jsonify({"success": True, "user": session["username"], "message": "Already logged in."}), 200
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
            session["username"] = user["Username"]
            print(session)

            return jsonify({"success": True, "user": user}), 200
        else:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/register", methods=["POST"])
def add_user():
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
            .insert(
                {"Username": username, "Email": hashlib.sha256(email.encode()).hexdigest(),
                 "Password": hashlib.sha256(password.encode()).hexdigest()})
            .execute()
        )

        user = response.data[0]
        session["username"] = user["Username"]
        print(session)

        return jsonify({"success": True, "user": user}), 201

    except Exception as e:
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)
