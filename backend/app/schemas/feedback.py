from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., max_length=1000)

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    rating: int
    comment: str
    created_at: datetime
    user_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
