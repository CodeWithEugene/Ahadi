FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_SYSTEM_PYTHON=1
RUN pip install --no-cache-dir uv==0.9.*
WORKDIR /app/bridge
COPY bridge/pyproject.toml bridge/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY bridge/ahadi_bridge ./ahadi_bridge
COPY data /app/data
COPY scripts /app/scripts
EXPOSE 8000
CMD ["uv", "run", "--no-dev", "uvicorn", "ahadi_bridge.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
