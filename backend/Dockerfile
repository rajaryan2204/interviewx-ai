# =============================================================================
# Stage 1: Dependency builder
# =============================================================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies for compiling package extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into the user directory for easy copying
RUN pip install --user --no-cache-dir --no-warn-script-location -r requirements.txt

# =============================================================================
# Stage 2: Final lightweight image
# =============================================================================
FROM python:3.12-slim

WORKDIR /app

# Install runtime database libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed site-packages and script entrypoints
COPY --from=builder /root/.local /root/.local
COPY . .

# Update path to find uvicorn and other packages
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
