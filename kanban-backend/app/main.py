from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, boards, columns, cards, comments

app = FastAPI(title="Kanban API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(cards.router)
app.include_router(comments.router)

@app.get("/")
def root():
    return {"message": "Kanban API is running!", "docs": "/docs"}
