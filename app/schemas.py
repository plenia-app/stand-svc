from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class SocialMedia(BaseModel):
    linkedin: Optional[str] = Field(None, max_length=200)
    instagram: Optional[str] = Field(None, max_length=200)
    twitter: Optional[str] = Field(None, max_length=200)
    facebook: Optional[str] = Field(None, max_length=200)
    website: Optional[str] = Field(None, max_length=200)

class StandBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=100, description="Name of the company registering the stand")
    contact_email: EmailStr = Field(..., description="Primary contact email address")
    contact_phone: Optional[str] = Field(None, max_length=30, description="Optional contact phone number")
    stand_number: Optional[str] = Field(None, max_length=20, description="Optional designated stand location number")
    abstract: str = Field(..., min_length=10, max_length=2000, description="A summary of what the company will talk about at their stand")
    games: List[str] = Field(default_factory=list, description="Games that will be played at the stand")
    contests: List[str] = Field(default_factory=list, description="Contests that will be run at the stand")
    special_offers: List[str] = Field(default_factory=list, description="Giveaways, prizes, discount codes, or other special offers")
    social_media: SocialMedia = Field(default_factory=SocialMedia, description="Social media links for the company")
    electrical_req: bool = Field(default=False, description="Whether the stand requires electrical connection")

class StandCreate(StandBase):
    pass

class StandUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=100)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=30)
    stand_number: Optional[str] = Field(None, max_length=20)
    abstract: Optional[str] = Field(None, min_length=10, max_length=2000)
    games: Optional[List[str]] = None
    contests: Optional[List[str]] = None
    special_offers: Optional[List[str]] = None
    social_media: Optional[SocialMedia] = None
    electrical_req: Optional[bool] = None

class StandResponse(StandBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
