FROM python:3.11-slim
WORKDIR /app

# Copy requirements và install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# PORT truyền từ docker-compose / .env lúc runtime (mặc định 6001)
EXPOSE 6001

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-6001} --lifespan on"]
