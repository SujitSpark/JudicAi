from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .db.session import engine, Base
from .api.api_router import api_router

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JudicAI Backend", 
    version="1.0.0",
    description="High-fidelity judicial intelligence system for the Supreme Court."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "JudicAI Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
