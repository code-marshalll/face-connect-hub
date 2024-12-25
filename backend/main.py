from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import models
import schemas
import crud
from database import SessionLocal, engine
import face_recognition
import numpy as np
from PIL import Image
import io

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/auth/signup", response_model=schemas.User)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/auth/login", response_model=schemas.User)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return db_user

@app.post("/profile/setup/{user_id}", response_model=schemas.Profile)
async def setup_profile(
    user_id: int,
    profile: schemas.ProfileCreate,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Read and process the uploaded photo
    contents = await photo.read()
    image = Image.open(io.BytesIO(contents))
    
    # Save profile with photo
    return crud.create_profile(db=db, profile=profile, user_id=user_id, photo=contents)

@app.get("/profile/{user_id}", response_model=schemas.Profile)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = crud.get_profile(db, user_id=user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.post("/scan/face")
async def scan_face(photo: UploadFile = File(...), db: Session = Depends(get_db)):
    # Read and process the uploaded photo
    contents = await photo.read()
    image = Image.open(io.BytesIO(contents))
    
    # Find matching profile
    matched_profile = crud.find_matching_face(db, image)
    if not matched_profile:
        raise HTTPException(status_code=404, detail="No matching face found")
    
    return matched_profile