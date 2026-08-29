from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/agritwin"
    secret_key: str = "my-super-secret-jwt-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    weather_api_key: str ="https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={API key}"
    data_gov_api_key: str = "579b464db66ec23bdd0000011e64c557793c42ff40e2c5f1ec10bc04"
    
    # Development Seed Credentials
    admin_email: str = "admin@agritwin.ai"
    admin_password: str = "admin123"

    class Config:
        env_file = ".env"

settings = Settings()
