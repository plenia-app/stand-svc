from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, UTC
from typing import List, Optional
from app.database import get_collection
from app.schemas import StandCreate, StandUpdate, StandResponse

router = APIRouter(prefix="/api/stands", tags=["Stands"])

def get_stands_collection():
    return get_collection("stands")

def serialize_mongo_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.post("", response_model=StandResponse, status_code=status.HTTP_201_CREATED)
async def register_stand(stand_in: StandCreate, collection = Depends(get_stands_collection)):
    """
    Register a new stand for the conference.
    """
    stand_dict = stand_in.model_dump()
    
    # Add timestamps
    now = datetime.now(UTC)
    stand_dict["created_at"] = now
    stand_dict["updated_at"] = now
    
    # If social_media is none/not passed, initialize it as empty dict
    if not stand_dict.get("social_media"):
        stand_dict["social_media"] = {}

    result = await collection.insert_one(stand_dict)
    
    # Retrieve and return the created document
    created_stand = await collection.find_one({"_id": result.inserted_id})
    return serialize_mongo_doc(created_stand)

@router.get("", response_model=List[StandResponse])
async def list_stands(
    search: Optional[str] = None,
    collection = Depends(get_stands_collection)
):
    """
    Retrieve registered stands, optionally filtered by a text search term
    matching company name, abstract, games, or contests.
    """
    query = {}
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"company_name": search_regex},
            {"abstract": search_regex},
            {"games": search_regex},
            {"contests": search_regex},
            {"stand_number": search_regex}
        ]
        
    cursor = collection.find(query).sort("created_at", -1)
    stands = []
    async for doc in cursor:
        stands.append(serialize_mongo_doc(doc))
    return stands

@router.get("/{id}", response_model=StandResponse)
async def get_stand(id: str, collection = Depends(get_stands_collection)):
    """
    Retrieve a specific stand's details by ID.
    """
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid stand ID format. Must be a 24-character hex string."
        )
        
    stand = await collection.find_one({"_id": obj_id})
    if not stand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stand with ID {id} not found."
        )
    return serialize_mongo_doc(stand)

@router.put("/{id}", response_model=StandResponse)
async def update_stand(
    id: str,
    stand_in: StandUpdate,
    collection = Depends(get_stands_collection)
):
    """
    Update details of an existing stand. Partial updates are supported.
    """
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid stand ID format. Must be a 24-character hex string."
        )
        
    existing = await collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stand with ID {id} not found."
        )
        
    # Get only fields explicitly set in the request
    update_data = {k: v for k, v in stand_in.model_dump(exclude_unset=True).items() if v is not None}
    
    if update_data:
        update_data["updated_at"] = datetime.now(UTC)
        
        # Merge social media instead of overwriting the whole object if it's partially set
        if "social_media" in update_data:
            social_data = update_data["social_media"]
            existing_social = existing.get("social_media", {})
            merged_social = {**existing_social, **social_data}
            update_data["social_media"] = merged_social
            
        await collection.update_one({"_id": obj_id}, {"$set": update_data})
        
    updated_stand = await collection.find_one({"_id": obj_id})
    return serialize_mongo_doc(updated_stand)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stand(id: str, collection = Depends(get_stands_collection)):
    """
    Delete a stand registration.
    """
    try:
        obj_id = ObjectId(id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid stand ID format. Must be a 24-character hex string."
        )
        
    result = await collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stand with ID {id} not found."
        )
