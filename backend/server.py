from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import os
import random
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from collections import Counter
from datetime import datetime, timezone

from scraper import GAME_CONFIG, scrape_game

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Lotto Laboratorio API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="Europe/Rome")
_update_lock = asyncio.Lock()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ----------------------- Models -----------------------
class Draw(BaseModel):
    game: str
    concorso: Optional[int] = None
    date: str
    main: List[int]
    jolly: Optional[int] = None
    superstar: Optional[int] = None
    oro: List[int] = []


class GenerateRequest(BaseModel):
    game: str
    strategy: str = "random"  # random | frequent | late | balanced
    tickets: int = 1


# ----------------------- Update logic -----------------------
async def run_update(game: Optional[str] = None):
    games = [game] if game else list(GAME_CONFIG.keys())
    results = {}
    async with _update_lock:
        for g in games:
            if g not in GAME_CONFIG:
                results[g] = {"status": "error", "error": "unknown game"}
                continue
            try:
                draws = await run_in_threadpool(scrape_game, g)
                inserted = 0
                for d in draws:
                    d["updated_at"] = now_iso()
                    await db.draws.update_one(
                        {"game": g, "date": d["date"]},
                        {"$set": d},
                        upsert=True,
                    )
                    inserted += 1
                total = await db.draws.count_documents({"game": g})
                await db.meta.update_one(
                    {"game": g},
                    {"$set": {
                        "game": g,
                        "last_updated": now_iso(),
                        "status": "ok",
                        "error": None,
                        "total_draws": total,
                    }},
                    upsert=True,
                )
                results[g] = {"status": "ok", "parsed": inserted, "total": total}
                logger.info(f"Update {g}: ok, {inserted} draws parsed, {total} total")
            except Exception as e:  # keep old good data on failure (fallback)
                logger.error(f"Update {g} failed: {e}")
                await db.meta.update_one(
                    {"game": g},
                    {"$set": {
                        "game": g,
                        "status": "error",
                        "error": str(e),
                        "last_attempt": now_iso(),
                    }},
                    upsert=True,
                )
                results[g] = {"status": "error", "error": str(e)}
    return results


async def startup_update():
    total = await db.draws.count_documents({})
    if total == 0:
        logger.info("No draws found, running initial scrape...")
        await run_update()


# ----------------------- Helpers -----------------------
async def get_draws(game: str, limit: int = 1000):
    docs = await db.draws.find(
        {"game": game}, {"_id": 0}
    ).sort("date", -1).to_list(length=limit)
    return docs


def compute_stats(draws, max_number):
    freq = Counter()
    for d in draws:
        freq.update(d.get("main", []))

    # delay: index (0 = most recent) of first draw containing the number
    delay = {}
    for n in range(1, max_number + 1):
        delay[n] = len(draws)
        for i, d in enumerate(draws):
            if n in d.get("main", []):
                delay[n] = i
                break

    frequent = sorted(
        [{"number": n, "count": freq.get(n, 0)} for n in range(1, max_number + 1)],
        key=lambda x: (-x["count"], x["number"]),
    )
    late = sorted(
        [{"number": n, "delay": delay[n]} for n in range(1, max_number + 1)],
        key=lambda x: (-x["delay"], x["number"]),
    )
    return frequent, late


# ----------------------- Endpoints -----------------------
@api_router.get("/")
async def root():
    return {"message": "Lotto Laboratorio API"}


@api_router.get("/games")
async def list_games():
    return [
        {
            "id": gid,
            "name": cfg["name"],
            "main_count": cfg["main_count"],
            "max_number": cfg["max_number"],
            "has_jolly": cfg["has_jolly"],
            "has_superstar": cfg["has_superstar"],
            "has_oro": cfg["has_oro"],
        }
        for gid, cfg in GAME_CONFIG.items()
    ]


@api_router.get("/status")
async def status():
    metas = await db.meta.find({}, {"_id": 0}).to_list(length=100)
    return {m["game"]: m for m in metas}


@api_router.get("/results/{game}")
async def results(game: str, limit: int = 50):
    if game not in GAME_CONFIG:
        raise HTTPException(status_code=404, detail="Gioco non trovato")
    draws = await get_draws(game, limit)
    meta = await db.meta.find_one({"game": game}, {"_id": 0})
    return {
        "game": game,
        "name": GAME_CONFIG[game]["name"],
        "meta": meta or {"status": "empty"},
        "draws": draws,
    }


@api_router.get("/stats/{game}")
async def stats(game: str):
    if game not in GAME_CONFIG:
        raise HTTPException(status_code=404, detail="Gioco non trovato")
    draws = await get_draws(game, 1000)
    if not draws:
        return {"game": game, "total_draws": 0, "frequent": [], "late": []}
    frequent, late = compute_stats(draws, GAME_CONFIG[game]["max_number"])
    return {
        "game": game,
        "total_draws": len(draws),
        "frequent": frequent,
        "late": late,
    }


@api_router.post("/update")
async def update(game: Optional[str] = None):
    if game and game not in GAME_CONFIG:
        raise HTTPException(status_code=404, detail="Gioco non trovato")
    results = await run_update(game)
    return {"updated_at": now_iso(), "results": results}


@api_router.post("/generate")
async def generate(req: GenerateRequest):
    if req.game not in GAME_CONFIG:
        raise HTTPException(status_code=404, detail="Gioco non trovato")
    cfg = GAME_CONFIG[req.game]
    count = cfg["main_count"]
    max_n = cfg["max_number"]
    tickets_n = max(1, min(req.tickets, 20))

    draws = await get_draws(req.game, 1000)
    frequent, late = ([], [])
    if draws:
        frequent, late = compute_stats(draws, max_n)

    def pick_weighted(weights):
        pool = list(range(1, max_n + 1))
        chosen = set()
        w = dict(weights)
        while len(chosen) < count:
            remaining = [n for n in pool if n not in chosen]
            ws = [w.get(n, 1) for n in remaining]
            chosen.add(random.choices(remaining, weights=ws, k=1)[0])
        return sorted(chosen)

    tickets = []
    for _ in range(tickets_n):
        if req.strategy == "frequent" and frequent:
            weights = {f["number"]: f["count"] + 1 for f in frequent}
            nums = pick_weighted(weights)
        elif req.strategy == "late" and late:
            weights = {l["number"]: l["delay"] + 1 for l in late}
            nums = pick_weighted(weights)
        elif req.strategy == "balanced" and frequent and late:
            hot = [f["number"] for f in frequent[:15]]
            cold = [l["number"] for l in late[:15]]
            pool = list(set(hot + cold))
            ticket = set()
            random.shuffle(pool)
            for n in pool:
                if len(ticket) >= count:
                    break
                ticket.add(n)
            while len(ticket) < count:
                ticket.add(random.randint(1, max_n))
            nums = sorted(ticket)
        else:
            nums = sorted(random.sample(range(1, max_n + 1), count))

        ticket_obj = {"main": nums}
        if cfg["has_superstar"]:
            ticket_obj["superstar"] = random.randint(1, 90)
        tickets.append(ticket_obj)

    return {"game": req.game, "strategy": req.strategy, "tickets": tickets}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await db.draws.create_index([("game", 1), ("date", -1)])
    asyncio.create_task(startup_update())
    # Scrape a few times a day (draws happen ~20:00 CET); manual dispatch also available.
    scheduler.add_job(run_update, "cron", hour="20,21,22", minute=30, id="daily_update", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started")


@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown(wait=False)
    client.close()
