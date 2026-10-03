from __future__ import annotations

import asyncio
import logging
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from time import monotonic

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from service.engine import PortfolioEngine, SearchCancelled

executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="portfolio-laya")
lock = asyncio.Lock()
engine: PortfolioEngine | None = None
startup_error: str | None = None
REQUEST_TIMEOUT = 7.5


def initialize() -> None:
    global engine, startup_error
    try:
        engine = PortfolioEngine()
        logging.getLogger("uvicorn.error").info("Portfolio Laya search ready")
    except Exception as error:
        startup_error = type(error).__name__
        logging.getLogger("uvicorn.error").exception("Portfolio model startup failed")


def release_engine() -> None:
    global engine
    if engine is not None:
        import gc
        import mlx.core as mx
        mx.synchronize()
        engine = None
        gc.collect()
        mx.clear_cache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    warmup = loop.run_in_executor(executor, initialize)
    try:
        yield
    finally:
        await warmup
        await loop.run_in_executor(executor, release_engine)
        executor.shutdown(wait=True, cancel_futures=True)


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.environ.get(
        "PORTFOLIO_ALLOWED_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"
    ).split(",") if origin.strip()],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class SearchRequest(BaseModel):
    query: str = Field(max_length=240)


@app.get("/health")
async def health():
    return {"ready": engine is not None, "error": startup_error, "source": "laya"}


def consume_exception(future: asyncio.Future) -> None:
    if not future.cancelled():
        future.exception()


@app.post("/search")
async def search(body: SearchRequest, request: Request):
    if engine is None:
        raise HTTPException(503, "Search is warming up" if startup_error is None else "Search unavailable")
    if not body.query.strip():
        return {"ids": [], "source": "laya"}
    deadline = monotonic() + REQUEST_TIMEOUT
    try:
        await asyncio.wait_for(lock.acquire(), timeout=REQUEST_TIMEOUT)
    except TimeoutError:
        raise HTTPException(503, "Search is busy")
    cancelled = threading.Event()
    future = None
    try:
        if await request.is_disconnected():
            raise HTTPException(499, "Request cancelled")
        future = asyncio.get_running_loop().run_in_executor(executor, engine.search, body.query, cancelled)
        while not future.done():
            done, _ = await asyncio.wait((future,), timeout=0.05)
            if not done and await request.is_disconnected():
                raise HTTPException(499, "Request cancelled")
            if not done and monotonic() >= deadline:
                raise HTTPException(504, "Search timed out")
        return await future
    except SearchCancelled:
        raise HTTPException(499, "Request cancelled")
    except asyncio.CancelledError:
        raise
    except HTTPException:
        raise
    except Exception:
        logging.getLogger("uvicorn.error").exception("Portfolio search failed")
        raise HTTPException(503, "Search unavailable")
    finally:
        cancelled.set()
        if future is not None and not future.done():
            future.add_done_callback(consume_exception)
        lock.release()
