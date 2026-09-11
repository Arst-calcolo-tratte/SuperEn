"""Scraper for Italian lottery results (SuperEnalotto, VinciCasa, 10eLotto).

Uses estrazionedellotto.it as a single, stable source with a predictable HTML
structure. Parsing is defensive: if the page layout changes or the request
fails, an exception is raised so the caller can keep the previously stored data
(no destructive overwrite).
"""
import re
import logging
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml",
}

GAME_CONFIG = {
    "superenalotto": {
        "name": "SuperEnalotto",
        "url": "https://www.estrazionedellotto.it/superenalotto/risultati-superenalotto",
        "container_id": "superEnalottoDraws",
        "main_count": 6,
        "max_number": 90,
        "has_jolly": True,
        "has_superstar": True,
        "has_oro": False,
    },
    "vincicasa": {
        "name": "VinciCasa",
        "url": "https://www.estrazionedellotto.it/vinci-casa/risultati-vinci-casa",
        "container_id": None,
        "main_count": 5,
        "max_number": 40,
        "has_jolly": False,
        "has_superstar": False,
        "has_oro": False,
    },
    "10elotto": {
        "name": "10eLotto",
        "url": "https://www.estrazionedellotto.it/10elotto/ultime-estrazioni-10elotto",
        "container_id": "draws10eLotto",
        "main_count": 20,
        "max_number": 90,
        "has_jolly": False,
        "has_superstar": False,
        "has_oro": True,
    },
}


def _parse_date(s):
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", s or "")
    if not m:
        return None
    d, mo, y = m.groups()
    return f"{y}-{mo}-{d}"


def fetch_html(url):
    resp = requests.get(url, headers=HEADERS, timeout=25)
    resp.raise_for_status()
    return resp.text


def _int_or_none(txt):
    txt = (txt or "").strip()
    return int(txt) if txt.isdigit() else None


def parse_draws(game, html):
    cfg = GAME_CONFIG[game]
    soup = BeautifulSoup(html, "lxml")

    if cfg["container_id"]:
        container = soup.find(id=cfg["container_id"])
    else:
        container = soup.find("div", class_="lottoDrawContainer")
    if not container:
        raise ValueError(f"Draw container not found for {game}")

    draws = []
    for block in container.find_all("div", class_="lottoDraws"):
        span = block.find("span")
        concorso = None
        if span:
            mm = re.search(r"(\d+)", span.get_text())
            if mm:
                concorso = int(mm.group(1))

        strong = block.find("strong")
        date = _parse_date(strong.get_text()) if strong else None
        if not date:
            continue

        rows = block.find_all("ul", class_="ballRow")

        if game == "superenalotto":
            main, jolly, superstar = [], None, None
            for ul in rows:
                for li in ul.find_all("li", class_="ball"):
                    n = _int_or_none(li.get_text())
                    if n is None:
                        continue
                    classes = li.get("class", [])
                    if "jolly" in classes:
                        jolly = n
                    elif "superstar" in classes:
                        superstar = n
                    else:
                        main.append(n)
            if len(main) < 6:
                continue
            draws.append({
                "game": game, "concorso": concorso, "date": date,
                "main": main[:6], "jolly": jolly, "superstar": superstar, "oro": [],
            })

        elif game == "vincicasa":
            main = []
            for ul in rows:
                for li in ul.find_all("li", class_="ball"):
                    n = _int_or_none(li.get_text())
                    if n is not None:
                        main.append(n)
            if len(main) < 5:
                continue
            draws.append({
                "game": game, "concorso": concorso, "date": date,
                "main": main[:5], "jolly": None, "superstar": None, "oro": [],
            })

        else:  # 10elotto
            main, oro, doppio = [], [], []
            for ul in rows:
                first_li = ul.find("li")
                label = first_li.get_text(strip=True) if first_li else ""
                if "Doppio Oro" in label:
                    for sp in ul.select("span.ball"):
                        n = _int_or_none(sp.get_text())
                        if n is not None:
                            doppio.append(n)
                elif "Numero Oro" in label:
                    for sp in ul.select("span.ball"):
                        n = _int_or_none(sp.get_text())
                        if n is not None:
                            oro.append(n)
                else:
                    if len(main) < 20:
                        for li in ul.find_all("li", class_="ball"):
                            n = _int_or_none(li.get_text())
                            if n is not None and len(main) < 20:
                                main.append(n)
            if len(main) < 20:
                continue
            draws.append({
                "game": game, "concorso": concorso, "date": date,
                "main": main[:20], "jolly": None, "superstar": None,
                "oro": doppio or oro,
            })

    if not draws:
        raise ValueError(f"No draws parsed for {game}")
    return draws


def scrape_game(game):
    cfg = GAME_CONFIG[game]
    html = fetch_html(cfg["url"])
    return parse_draws(game, html)
