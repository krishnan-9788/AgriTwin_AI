import sys
import os

# Ensure the app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.services.auth import get_password_hash
from app.config import settings

def reset_admin_password():
    db = SessionLocal()
    try:
        admin_email = settings.admin_email
        new_pass = settings.admin_password
        
        print(f"Looking for user: {admin_email}")
        user = db.query(User).filter(User.email == admin_email).first()
        
        if not user:
            print("User does not exist. Starting backend will automatically create it.")
            return

        print(f"Found user {admin_email}. Resetting password to configured development default...")
        user.password_hash = get_password_hash(new_pass)
        db.commit()
        print(f"SUCCESS: Password for {admin_email} has been reset to: {new_pass}")
        print("You can now login successfully!")
        
    except Exception as e:
        print(f"Error resetting password: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()
