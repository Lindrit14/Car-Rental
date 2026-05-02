FROM python:3.12-slim

WORKDIR /app

# git is needed because spyne is installed from a git source in pyproject.toml
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application
COPY app/ ./app/

ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

CMD ["uv", "run", "python", "-m", "app.server"]