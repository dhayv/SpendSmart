from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import database
from router import expenses_endpoint as expense_router, income_endpoint as income_router, user_endpoint as user_router
import logging
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')




# Startup event before server starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    database.create_db_and_tables()
    logging.info("Database Created")

    yield

app = FastAPI(lifespan=lifespan)

#connect to react
origins = [
    "http://localhost:3000"
]

app.add_middleware (
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/api")
def hello():
    return {"message": "Hello, World"}


app.include_router(expense_router.router)
app.include_router(income_router.router)
app.include_router(user_router.router)

if __name__ == "__main__":
    database.create_db_and_tables()
    #import uvicorn
    #uvicorn.run(app, host="0.0.0.0", port=8000)