from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_url: str
    database_name: str = "conference_db"
    port: int = 8000
    host: str = "127.0.0.1"

    # Pydantic v2 Settings configuration
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
