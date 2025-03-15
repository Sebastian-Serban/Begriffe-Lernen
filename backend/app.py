from flask import Flask, jsonify, request
from supabase import create_client
import hashlib

app = Flask(__name__)

name = ""
SUPABASE_URL = "https://pbchksafinhryhmfgcan.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY2hrc2FmaW5ocnlobWZnY2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDE5MTAsImV4cCI6MjA1NjI3NzkxMH0.gFBvPNx3KGSdMXYQbdr-g6XqhKjqZ32Yo9rT39Ktpzg"

@app.route("/login/<username>/<password>", methods=["GET"])
def get_user(username, password):
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    response = (
        supabase.table("users")
        .select("subjects")
        .eq("username", username)
        .eq("password", hashlib.sha256(password.encode()).hexdigest())
        .execute())

    if response.data:
        global name
        name = username

        return jsonify(response.data), 200
    else:
        return jsonify([])


@app.route("/register/<username>/<email>/<password>", methods=["POST"])
def add_user(username, email, password):
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    response = (
        supabase.table("BENUTZER")
        .insert(
            {"benutzername": username, "email": str(hashlib.sha256(email.encode()).hexdigest()), "passwort": str(hashlib.sha256(password.encode()).hexdigest())})
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
    app.run(host="localhost")
