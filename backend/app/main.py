from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, farms, weather, soil, disease, market, irrigation, alerts

try:
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate: Add missing float columns for Soil ML Model
    from sqlalchemy import text
    columns_to_add = ["n_val FLOAT", "p_val FLOAT", "k_val FLOAT", "ec FLOAT", "oc FLOAT", "s FLOAT", "zn FLOAT", "fe FLOAT", "cu FLOAT", "mn FLOAT", "b FLOAT"]
    farm_columns_to_add = ["latest_disease VARCHAR", "disease_confidence FLOAT"]
    with engine.begin() as conn:
        for col in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE soil_data ADD COLUMN IF NOT EXISTS {col}"))
            except Exception as inner_e:
                pass
        for col in farm_columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE farms ADD COLUMN IF NOT EXISTS {col}"))
            except Exception as inner_e:
                pass
                
    # Safe demo seed mechanism for admin user
    from .database import SessionLocal
    from .models import User
    from .services.auth import get_password_hash
    from .config import settings
    db = SessionLocal()
    try:
        admin_email = settings.admin_email
        admin_pass = settings.admin_password
        admin_user = db.query(User).filter(User.email == admin_email).first()
        hashed = get_password_hash(admin_pass)
        if not admin_user:
            new_admin = User(name="Admin Demo", email=admin_email, password_hash=hashed)
            db.add(new_admin)
            db.commit()
            print(f"Seeded demo admin user: {admin_email} / {admin_pass}")
    except Exception as e:
        print(f"Error seeding admin user: {e}")
    finally:
        db.close()
        
except Exception as e:
    print(f"Warning: Could not create or migrate database tables. DB error: {e}")

app = FastAPI(title="AgriTwin AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(weather.router)
app.include_router(soil.router)
app.include_router(disease.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(irrigation.router)
app.include_router(alerts.router)

@app.get("/")
def root():
    return {"message": "Welcome to AgriTwin AI API"}
