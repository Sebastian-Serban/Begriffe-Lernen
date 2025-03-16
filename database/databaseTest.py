from supabase import create_client, Client
import random


def main():
    url = "https://pbchksafinhryhmfgcan.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY2hrc2FmaW5ocnlobWZnY2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDE5MTAsImV4cCI6MjA1NjI3NzkxMH0.gFBvPNx3KGSdMXYQbdr-g6XqhKjqZ32Yo9rT39Ktpzg"

    supabase = create_client(url, key)

    # Add Users

    for i in range(0, 5):
        data = supabase.table("User").insert(
            {"Username": f"Pluto {random.uniform(0, 1000000)}", "Email": "test@example.com",
             "Password": "pw1234"}).execute()
        print(data)

    # Add a Learning Set

    data = supabase.table("LearningSet").insert(
        {"Title": "OG Lernset", "Description": "Beinhaltet Testdaten", "Score": "10.01", "UserID": 12}).execute()
    print(data)

    # Add Cards

    for i in range(0, 5):
        data = supabase.table("Card").insert(
            {"Term": f"Der Term: {random.uniform(0, 100)}", "Explanation": "Die Erklärung", "LearningSetID": 2}).execute()
        print(data)



if __name__ == "__main__":
    main()
