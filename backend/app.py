from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import jwt
import uuid
import sqlite3
import random
import csv
import asyncio
from datetime import datetime, timedelta
import threading
import shutil
import os

app = FastAPI()
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect('app.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS sessions
                 (username TEXT, token TEXT, created_at TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS random_numbers
                 (timestamp TEXT PRIMARY KEY, value REAL)''')
    conn.commit()
    conn.close()

init_db()

SECRET_KEY = str(uuid.uuid4())
ALGORITHM = "HS256"

file_lock = threading.Lock()

def create_token(username: str) -> str:
    expiration = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode(
        {"sub": username, "exp": expiration},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    conn = sqlite3.connect('app.db')
    c = conn.cursor()
    c.execute("INSERT INTO sessions VALUES (?, ?, ?)",
              (username, token, datetime.utcnow()))
    conn.commit()
    conn.close()
    
    return token

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def generate_random_numbers():
    while True:
        value = random.random()
        timestamp = datetime.now().isoformat()
        
        conn = sqlite3.connect('app.db')
        c = conn.cursor()
        c.execute("INSERT INTO random_numbers VALUES (?, ?)", (timestamp, value))
        conn.commit()
        conn.close()
        
        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(generate_random_numbers())

@app.post("/login")
async def login(username: str, password: str):
    token = create_token(username)
    return {"token": token}

@app.websocket("/ws/random-numbers")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            conn = sqlite3.connect('app.db')
            c = conn.cursor()
            c.execute("SELECT * FROM random_numbers ORDER BY timestamp DESC LIMIT 1")
            result = c.fetchone()
            conn.close()
            
            if result:
                await websocket.send_json({
                    "timestamp": result[0],
                    "value": result[1]
                })
            await asyncio.sleep(1)
    except:
        await websocket.close()

@app.get("/csv")
async def read_csv(_: str = Depends(verify_token)):
    try:
        with file_lock:
            with open('backend_table.csv', 'r') as file:
                return list(csv.DictReader(file))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="CSV file not found")

@app.post("/csv")
async def create_csv_row(data: dict, _: str = Depends(verify_token)):
    try:
        with file_lock:
            if os.path.exists('backend_table.csv'):
                shutil.copy2('backend_table.csv', 'backend_table.backup.csv')
            
            rows = []
            try:
                with open('backend_table.csv', 'r') as file:
                    reader = csv.DictReader(file)
                    rows = list(reader)
            except FileNotFoundError:
                pass
            
            rows.append(data)
            
            with open('backend_table.csv', 'w', newline='') as file:
                if rows:
                    writer = csv.DictWriter(file, fieldnames=rows[0].keys())
                    writer.writeheader()
                    writer.writerows(rows)
            
            return {"message": "Row added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/csv/{row_id}")
async def update_csv_row(row_id: int, data: dict, _: str = Depends(verify_token)):
    try:
        with file_lock:
            shutil.copy2('backend_table.csv', 'backend_table.backup.csv')
            
            rows = []
            with open('backend_table.csv', 'r') as file:
                reader = csv.DictReader(file)
                rows = list(reader)
                
            if 0 <= row_id < len(rows):
                rows[row_id].update(data)
            else:
                raise HTTPException(status_code=404, detail="Row not found")
            
            with open('backend_table.csv', 'w', newline='') as file:
                writer = csv.DictWriter(file, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
            
            return {"message": "Row updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/csv/{row_id}")
async def delete_csv_row(row_id: int, _: str = Depends(verify_token)):
    try:
        with file_lock:
            shutil.copy2('backend_table.csv', 'backend_table.backup.csv')
            
            rows = []
            with open('backend_table.csv', 'r') as file:
                reader = csv.DictReader(file)
                rows = list(reader)
                
            if 0 <= row_id < len(rows):
                del rows[row_id]
            else:
                raise HTTPException(status_code=404, detail="Row not found")
            
            with open('backend_table.csv', 'w', newline='') as file:
                if rows:
                    writer = csv.DictWriter(file, fieldnames=rows[0].keys())
                    writer.writeheader()
                    writer.writerows(rows)
            
            return {"message": "Row deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/restore")
async def restore_backup(_: str = Depends(verify_token)):
    try:
        if os.path.exists('backend_table.backup.csv'):
            shutil.copy2('backend_table.backup.csv', 'backend_table.csv')
            return {"message": "Backup restored successfully"}
        raise HTTPException(status_code=404, detail="No backup file found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)