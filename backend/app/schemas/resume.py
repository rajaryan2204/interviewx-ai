from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ResumeResponse(BaseModel):
    id: int
    file_name: str
    uploaded_at: datetime
    analysis: dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class ResumeDetailResponse(BaseModel):
    id: int
    file_name: str
    parsed_text: str
    analysis: dict[str, Any]
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
