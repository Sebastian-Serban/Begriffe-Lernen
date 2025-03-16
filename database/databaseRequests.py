from supabase import create_client


def main():
    url = "https://pbchksafinhryhmfgcan.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY2hrc2FmaW5ocnlobWZnY2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MDE5MTAsImV4cCI6MjA1NjI3NzkxMH0.gFBvPNx3KGSdMXYQbdr-g6XqhKjqZ32Yo9rT39Ktpzg"

    supabase = create_client(url, key)

    # Retrieve users
    data = supabase.table("User").select("Username").execute()
    for i in data.data:
        print(i["Username"])

    # Retrieve Learning Sets where User is 12
    data = supabase.table("LearningSet").select("*").eq("UserID", 12).execute()
    for i in data.data:
        print(i["LearningSetID"])

if __name__ == "__main__":
    main()
