from sqlalchemy.orm import Session
import models
import schemas
import face_recognition
import numpy as np
from PIL import Image
import io
import bcrypt

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not bcrypt.checkpw(password.encode('utf-8'), user.hashed_password):
        return None
    return user

def create_profile(db: Session, profile: schemas.ProfileCreate, user_id: int, photo: bytes):
    # Process the photo to get face encoding
    image = Image.open(io.BytesIO(photo))
    face_encoding = get_face_encoding(image)
    
    db_profile = models.Profile(
        user_id=user_id,
        full_name=profile.full_name,
        additional_info=profile.additional_info,
        photo=photo,
        face_encoding=face_encoding.tobytes() if face_encoding is not None else None
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def get_profile(db: Session, user_id: int):
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()

def get_face_encoding(image):
    # Convert PIL Image to numpy array
    image_array = np.array(image)
    
    # Get face encodings
    face_locations = face_recognition.face_locations(image_array)
    if not face_locations:
        return None
    
    face_encodings = face_recognition.face_encodings(image_array, face_locations)
    return face_encodings[0] if face_encodings else None

def find_matching_face(db: Session, image):
    # Get face encoding for the uploaded image
    face_encoding = get_face_encoding(image)
    if face_encoding is None:
        return None
    
    # Get all profiles
    profiles = db.query(models.Profile).all()
    
    # Find matching face
    for profile in profiles:
        if profile.face_encoding is None:
            continue
        
        stored_encoding = np.frombuffer(profile.face_encoding)
        distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
        
        if distance < 0.6:  # Threshold for face matching
            return {
                "user_id": profile.user_id,
                "full_name": profile.full_name,
                "additional_info": profile.additional_info
            }
    
    return None