from flask import Flask, jsonify, request
from supabase import create_client
import hashlib
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

name = ""
SUPABASE_URL = "https://pbchksafinhryhmfgcan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY2hrc2FmaW5ocnlobWZnY2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDE5MTAsImV4cCI6MjA1NjI3NzkxMH0.gFBvPNx3KGSdMXYQbdr-g6XqhKjqZ32Yo9rT39Ktpzg"

@app.route("/login", methods=["POST"])
def get_user():
    email = request.form.get("email")
    password = request.form.get("password")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    response = (
        supabase.table("User")
        .select("Email")
        .eq("Email", email)
        .eq("Password", hashlib.sha256(password.encode()).hexdigest())
        .execute())

    if response.data:
        return jsonify(response.data), 200
    else:
        return jsonify([])


@app.route("/register", methods=["POST"])
def add_user():
    username = request.form.get("username")
    email = request.form.get("email")
    password = request.form.get("password")

    print(username, email, password)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    response = (
        supabase.table("User")
        .insert(
            {"Username": username, "Email": str(hashlib.sha256(email.encode()).hexdigest()), "Password": str(hashlib.sha256(password.encode()).hexdigest())})
        .execute())

    return jsonify(response.data), 200



@app.route("/save", methods=["PUT"])
def upload():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    data = request.get_json()

    response = (
        supabase.table("users")
        .update({"subjects": data})
        .eq("username", name)
        .execute()
    )

    print(data)
    return jsonify(response.data), 200


if __name__ == "__main__":
    app.run()
