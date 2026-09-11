"""Backend tests for Lotto Laboratorio API."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lotto-lab-fix.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

GAMES = ["superenalotto", "vincicasa", "10elotto"]
EXPECTED_COUNT = {"superenalotto": 6, "vincicasa": 5, "10elotto": 20}
MAX_NUM = {"superenalotto": 90, "vincicasa": 40, "10elotto": 90}


@pytest.fixture(scope="session")
def ensure_data():
    """Trigger update if empty."""
    r = requests.get(f"{API}/status", timeout=30)
    status = r.json() if r.status_code == 200 else {}
    need = False
    for g in GAMES:
        if g not in status or status[g].get("status") != "ok":
            need = True
    if need:
        # trigger update
        requests.post(f"{API}/update", timeout=120)
        # wait & poll
        for _ in range(20):
            time.sleep(2)
            r = requests.get(f"{API}/status", timeout=30)
            status = r.json() if r.status_code == 200 else {}
            if all(status.get(g, {}).get("status") == "ok" for g in GAMES):
                break
    return status


# ---------- Games endpoint ----------
class TestGames:
    def test_list_games(self):
        r = requests.get(f"{API}/games", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 3
        by_id = {g["id"]: g for g in data}
        assert by_id["superenalotto"]["main_count"] == 6
        assert by_id["superenalotto"]["max_number"] == 90
        assert by_id["superenalotto"]["has_jolly"] is True
        assert by_id["superenalotto"]["has_superstar"] is True
        assert by_id["vincicasa"]["main_count"] == 5
        assert by_id["vincicasa"]["max_number"] == 40
        assert by_id["10elotto"]["main_count"] == 20
        assert by_id["10elotto"]["has_oro"] is True


# ---------- Results endpoint ----------
class TestResults:
    @pytest.mark.parametrize("game", GAMES)
    def test_results_ok(self, ensure_data, game):
        r = requests.get(f"{API}/results/{game}", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["game"] == game
        assert "draws" in data and "meta" in data
        if not data["draws"]:
            pytest.skip(f"No draws for {game} (scraping may have failed)")
        # sorted desc by date
        dates = [d["date"] for d in data["draws"]]
        assert dates == sorted(dates, reverse=True)
        first = data["draws"][0]
        assert len(first["main"]) == EXPECTED_COUNT[game]
        for n in first["main"]:
            assert 1 <= n <= MAX_NUM[game]
        assert data["meta"].get("status") == "ok"
        assert "last_updated" in data["meta"]

    def test_superenalotto_has_jolly_superstar(self, ensure_data):
        r = requests.get(f"{API}/results/superenalotto", timeout=30)
        data = r.json()
        if not data["draws"]:
            pytest.skip("No draws")
        # at least the latest one should have jolly & superstar
        latest = data["draws"][0]
        assert latest.get("jolly") is not None, "SuperEnalotto latest draw missing jolly"
        assert latest.get("superstar") is not None, "SuperEnalotto latest draw missing superstar"

    def test_10elotto_has_oro(self, ensure_data):
        r = requests.get(f"{API}/results/10elotto", timeout=30)
        data = r.json()
        if not data["draws"]:
            pytest.skip("No draws")
        latest = data["draws"][0]
        assert isinstance(latest.get("oro"), list)
        assert len(latest["oro"]) >= 1, "10elotto latest draw missing oro"

    def test_results_invalid_game_404(self):
        r = requests.get(f"{API}/results/nonexistent", timeout=30)
        assert r.status_code == 404


# ---------- Stats endpoint ----------
class TestStats:
    @pytest.mark.parametrize("game", GAMES)
    def test_stats(self, ensure_data, game):
        r = requests.get(f"{API}/stats/{game}", timeout=30)
        assert r.status_code == 200
        data = r.json()
        if data["total_draws"] == 0:
            pytest.skip(f"no draws for {game}")
        assert data["total_draws"] > 0
        assert len(data["frequent"]) == MAX_NUM[game]
        assert "count" in data["frequent"][0]
        assert len(data["late"]) == MAX_NUM[game]
        assert "delay" in data["late"][0]

    def test_stats_invalid_game_404(self):
        r = requests.get(f"{API}/stats/nope", timeout=30)
        assert r.status_code == 404


# ---------- Update endpoint ----------
class TestUpdate:
    def test_update_single_game(self):
        r = requests.post(f"{API}/update?game=superenalotto", timeout=120)
        assert r.status_code == 200
        data = r.json()
        assert "results" in data and "superenalotto" in data["results"]

    def test_update_invalid_game_404(self):
        r = requests.post(f"{API}/update?game=badgame", timeout=30)
        assert r.status_code == 404


# ---------- Generate endpoint ----------
class TestGenerate:
    @pytest.mark.parametrize("strategy", ["random", "frequent", "late", "balanced"])
    @pytest.mark.parametrize("game", GAMES)
    def test_generate(self, ensure_data, game, strategy):
        r = requests.post(f"{API}/generate", json={"game": game, "strategy": strategy, "tickets": 2}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data["tickets"]) == 2
        for t in data["tickets"]:
            assert len(t["main"]) == EXPECTED_COUNT[game]
            assert len(set(t["main"])) == EXPECTED_COUNT[game], "duplicates"
            for n in t["main"]:
                assert 1 <= n <= MAX_NUM[game]
            if game == "superenalotto":
                assert "superstar" in t and 1 <= t["superstar"] <= 90

    def test_generate_invalid_game(self):
        r = requests.post(f"{API}/generate", json={"game": "bad", "strategy": "random", "tickets": 1}, timeout=30)
        assert r.status_code == 404
