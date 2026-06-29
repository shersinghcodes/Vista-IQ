import sqlite3
import os

DB_PATH = "auth.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found. Make sure you run this from the project root.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if language_preference exists in users
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        if "language_preference" not in columns:
            print("Adding language_preference to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN language_preference VARCHAR DEFAULT 'en'")
        else:
            print("language_preference already exists in users.")

        # Check if language exists in ai_interview_sessions
        cursor.execute("PRAGMA table_info(ai_interview_sessions)")
        columns = [info[1] for info in cursor.fetchall()]
        if "language" not in columns:
            print("Adding language to ai_interview_sessions...")
            cursor.execute("ALTER TABLE ai_interview_sessions ADD COLUMN language VARCHAR DEFAULT 'en'")
        else:
            print("language already exists in ai_interview_sessions.")

        conn.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
