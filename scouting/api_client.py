import requests
import os
import streamlit as st
from typing import Optional

BASE_URL = "https://api.fullfield.info/v1"

def get_headers():
    token = os.environ.get("FULLFIELD_API_TOKEN", "")
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}

@st.cache_data(ttl=600)
def fetch_seasons():
    all_seasons = []
    page = 1
    while True:
        r = requests.get(f"{BASE_URL}/seasons", headers=get_headers(), params={"per_page": 100, "page": page})
        if r.status_code != 200:
            break
        data = r.json()
        all_seasons.extend(data.get("data", []))
        meta = data.get("meta", {})
        if meta.get("current_page", page) >= meta.get("last_page", page):
            break
        page += 1
    return all_seasons

@st.cache_data(ttl=600)
def fetch_competitions(season_uuid: Optional[str] = None, country_id: Optional[int] = None):
    params = {"per_page": 100}
    if season_uuid:
        params["filter[season_uuid]"] = season_uuid
    if country_id:
        params["filter[country_id]"] = country_id
    all_comps = []
    page = 1
    while True:
        params["page"] = page
        r = requests.get(f"{BASE_URL}/competitions", headers=get_headers(), params=params)
        if r.status_code != 200:
            break
        data = r.json()
        all_comps.extend(data.get("data", []))
        meta = data.get("meta", {})
        if meta.get("current_page", page) >= meta.get("last_page", page):
            break
        page += 1
    return all_comps

@st.cache_data(ttl=600)
def fetch_competition_teams(competition_uuid: str):
    r = requests.get(f"{BASE_URL}/competition-teams/{competition_uuid}", headers=get_headers())
    if r.status_code != 200:
        return []
    return r.json().get("data", [])

@st.cache_data(ttl=300)
def fetch_schedule(competition_uuid: str, per_page: int = 100):
    all_schedules = []
    page = 1
    while True:
        r = requests.get(
            f"{BASE_URL}/schedule/{competition_uuid}",
            headers=get_headers(),
            params={"per_page": per_page, "page": page}
        )
        if r.status_code != 200:
            break
        data = r.json()
        all_schedules.extend(data.get("data", []))
        meta = data.get("meta", {})
        if meta.get("current_page", page) >= meta.get("last_page", page):
            break
        page += 1
    return all_schedules

@st.cache_data(ttl=300)
def fetch_competition_players(competition_uuid: str):
    all_players = []
    page = 1
    while page <= 50:
        r = requests.get(
            f"{BASE_URL}/competition/{competition_uuid}/players",
            headers=get_headers(),
            params={"per_page": 100, "page": page}
        )
        if r.status_code != 200:
            break
        data = r.json()
        all_players.extend(data.get("data", []))
        meta = data.get("meta", {})
        if meta.get("current_page", page) >= meta.get("last_page", page):
            break
        page += 1
    return all_players

@st.cache_data(ttl=300)
def fetch_boxscore(competition_uuid: str, schedule_uuid: Optional[str] = None, per_page: int = 100, max_pages: int = 100):
    all_box = []
    page = 1
    params = {"per_page": per_page, "page": page}
    if schedule_uuid:
        params["filter[schedule_uuid]"] = schedule_uuid
    while page <= max_pages:
        params["page"] = page
        r = requests.get(
            f"{BASE_URL}/competition/{competition_uuid}/boxscore",
            headers=get_headers(),
            params=params
        )
        if r.status_code != 200:
            break
        resp = r.json()
        inner = resp.get("data", resp)
        rows = inner.get("data", []) if isinstance(inner, dict) else inner
        if not rows:
            break
        all_box.extend(rows)
        meta = inner.get("meta", {}) if isinstance(inner, dict) else {}
        if meta.get("current_page", page) >= meta.get("last_page", page):
            break
        page += 1
    return all_box

@st.cache_data(ttl=300)
def fetch_team_boxscore(competition_uuid: str, team_uuid: str, max_pages: int = 50):
    all_box = []
    page = 1
    while page <= max_pages:
        r = requests.get(
            f"{BASE_URL}/competition/{competition_uuid}/boxscore",
            headers=get_headers(),
            params={"per_page": 100, "page": page}
        )
        if r.status_code != 200:
            break
        resp = r.json()
        inner = resp.get("data", resp)
        rows = inner.get("data", []) if isinstance(inner, dict) else inner
        if not rows:
            break
        team_rows = [row for row in rows if row.get("competition_team_uuid") == team_uuid]
        all_box.extend(team_rows)
        meta = inner.get("meta", {}) if isinstance(inner, dict) else {}
        if meta.get("current_page", page) >= meta.get("last_page", page):
            break
        page += 1
    return all_box

@st.cache_data(ttl=300)
def fetch_game_boxscore(competition_uuid: str, schedule_uuid: str):
    return fetch_boxscore(competition_uuid, schedule_uuid=schedule_uuid, per_page=100, max_pages=5)
