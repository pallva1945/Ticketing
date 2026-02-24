import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from api_client import (
    fetch_seasons, fetch_competitions, fetch_competition_teams,
    fetch_schedule, fetch_competition_players, fetch_boxscore,
    fetch_game_boxscore
)
from config import TEAM_ID_MAP, PLAYER_ID_MAP

st.set_page_config(
    page_title="PV Basketball Scouting",
    page_icon="🏀",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main-header { font-size: 1.8rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
    .sub-header { font-size: 0.95rem; color: #64748b; margin-bottom: 1.5rem; }
    .metric-card {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 12px; padding: 1.2rem; text-align: center;
        border: 1px solid #e2e8f0;
    }
    .metric-value { font-size: 1.8rem; font-weight: 700; color: #1e293b; }
    .metric-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stDataFrame { border-radius: 8px; }
    div[data-testid="stSidebar"] { background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); }
    div[data-testid="stSidebar"] .stSelectbox label,
    div[data-testid="stSidebar"] .stRadio label,
    div[data-testid="stSidebar"] p,
    div[data-testid="stSidebar"] .stMarkdown { color: #e2e8f0 !important; }
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("### 🏀 PV Scouting Hub")
    st.markdown("---")
    view_mode = st.radio("View Mode", ["Team View", "Player View"], horizontal=True)

    seasons = fetch_seasons()
    recent_seasons = [s for s in seasons if any(y in s["name"] for y in ["2023", "2024", "2025", "2026"])]
    recent_seasons.sort(key=lambda s: s["name"], reverse=True)
    if not recent_seasons:
        recent_seasons = seasons[-5:]

    season_names = [s["name"] for s in recent_seasons]
    selected_season_name = st.selectbox("Season", season_names, index=0)
    selected_season = next((s for s in recent_seasons if s["name"] == selected_season_name), None)

    competitions = []
    if selected_season:
        competitions = fetch_competitions(season_uuid=selected_season["uuid"])

    if not competitions:
        st.warning("No competitions found for this season.")
        st.stop()

    comp_labels = [f"{c['league_name']} ({c.get('country',{}).get('name','?')})" for c in competitions]
    selected_comp_idx = st.selectbox("Competition", range(len(comp_labels)), format_func=lambda i: comp_labels[i], index=0)
    selected_comp = competitions[selected_comp_idx]

    st.markdown("---")
    st.markdown(
        f"**Mapped Teams:** {len(TEAM_ID_MAP)}  \n"
        f"**Mapped Players:** {len(PLAYER_ID_MAP)}"
    )

comp_uuid = selected_comp["uuid"]
teams = fetch_competition_teams(comp_uuid)


def find_team_games(schedules, team_uuid):
    games = []
    for s in schedules:
        home = s.get("home_team", {})
        away = s.get("away_team", {})
        if home.get("uuid") == team_uuid or away.get("uuid") == team_uuid:
            games.append(s)
    return games


def aggregate_player_stats(boxscore_rows, players_lookup):
    stats = {}
    for row in boxscore_rows:
        p_uuid = row.get("player_uuid", "")
        if p_uuid not in stats:
            player_info = players_lookup.get(p_uuid, {})
            stats[p_uuid] = {
                "player_uuid": p_uuid,
                "name": f"{player_info.get('first_name', '?')} {player_info.get('last_name', '?')}",
                "role": player_info.get("role", ""),
                "games": 0, "pts": 0, "offensive_rebound": 0,
                "defensive_rebound": 0, "assist": 0, "steal": 0,
                "block": 0, "turnover": 0, "minute": 0,
                "pts2_made": 0, "pts2_all": 0,
                "pts3_made": 0, "pts3_all": 0,
                "ft_made": 0, "ft_all": 0,
                "fg_made": 0, "fg_all": 0,
                "personal_foul": 0,
            }
        stats[p_uuid]["games"] += 1
        for k in ["pts", "offensive_rebound", "defensive_rebound", "assist",
                   "steal", "block", "turnover", "minute", "personal_foul",
                   "pts2_made", "pts2_all", "pts3_made", "pts3_all",
                   "ft_made", "ft_all", "fg_made", "fg_all"]:
            stats[p_uuid][k] += row.get(k, 0) or 0
    return stats


if view_mode == "Team View":
    st.markdown('<p class="main-header">Team View</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Select a team to view their recent games, roster, and stats</p>', unsafe_allow_html=True)

    if not teams:
        st.info("No teams found for this competition.")
        st.stop()

    team_names = [t.get("team_name", "Unknown") for t in teams]
    selected_team_name = st.selectbox("Select Team", sorted(team_names))
    selected_team = next((t for t in teams if t.get("team_name") == selected_team_name), None)

    if not selected_team:
        st.stop()

    team_uuid = selected_team["uuid"]
    sponsor = selected_team.get("sponsor_name") or ""
    club = selected_team.get("club", {}).get("name", "")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f'<div class="metric-card"><div class="metric-label">Team</div><div class="metric-value" style="font-size:1.2rem">{selected_team_name}</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="metric-card"><div class="metric-label">Sponsor</div><div class="metric-value" style="font-size:1.2rem">{sponsor or "—"}</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="metric-card"><div class="metric-label">Club</div><div class="metric-value" style="font-size:1.2rem">{club or "—"}</div></div>', unsafe_allow_html=True)

    st.markdown("---")

    tab_games, tab_roster, tab_stats = st.tabs(["📅 Games & Results", "👥 Roster", "📊 Team Stats"])

    with tab_games:
        with st.spinner("Loading schedule..."):
            schedules = fetch_schedule(comp_uuid)

        team_games = find_team_games(schedules, team_uuid)

        if not team_games:
            st.info("No games found for this team in the schedule.")
        else:
            team_games.sort(key=lambda g: g.get("start_time", ""), reverse=True)
            st.markdown(f"**{len(team_games)} games found**")

            game_rows = []
            for g in team_games:
                home = g.get("home_team", {})
                away = g.get("away_team", {})
                h_score = g.get("home_score")
                a_score = g.get("away_score")
                is_home = home.get("uuid") == team_uuid
                opponent = away.get("team_name", "?") if is_home else home.get("team_name", "?")
                location = "Home" if is_home else "Away"

                if h_score is not None and a_score is not None:
                    if is_home:
                        result = "W" if h_score > a_score else "L"
                        score = f"{h_score} - {a_score}"
                    else:
                        result = "W" if a_score > h_score else "L"
                        score = f"{a_score} - {h_score}"
                else:
                    result = "—"
                    score = "TBD"

                game_rows.append({
                    "Date": (g.get("start_time") or "")[:10],
                    "Opponent": opponent,
                    "H/A": location,
                    "Result": result,
                    "Score": score,
                    "Quarters": g.get("period_score", ""),
                })

            df_games = pd.DataFrame(game_rows)
            st.dataframe(df_games, use_container_width=True, hide_index=True)

            played = [g for g in game_rows if g["Result"] in ["W", "L"]]
            if played:
                wins = sum(1 for g in played if g["Result"] == "W")
                losses = len(played) - wins
                c1, c2, c3 = st.columns(3)
                with c1:
                    st.metric("Wins", wins)
                with c2:
                    st.metric("Losses", losses)
                with c3:
                    st.metric("Win %", f"{wins/len(played)*100:.1f}%")

    with tab_roster:
        with st.spinner("Loading roster..."):
            all_players = fetch_competition_players(comp_uuid)
            boxscore_data = fetch_boxscore(comp_uuid, per_page=100, max_pages=30)

        team_player_uuids = set(
            row["player_uuid"] for row in boxscore_data
            if row.get("competition_team_uuid") == team_uuid
        )

        team_players = [p for p in all_players if p["uuid"] in team_player_uuids]

        if not team_players:
            st.info("No roster data found via boxscores. The team may not have played yet.")
        else:
            roster_rows = []
            for p in team_players:
                roster_rows.append({
                    "Name": f"{p.get('first_name', '')} {p.get('last_name', '')}",
                    "Role": p.get("role", "—"),
                    "Birthdate": (p.get("birthdate") or "—")[:10],
                    "Nationality": p.get("nationality", "—"),
                })
            df_roster = pd.DataFrame(roster_rows)
            df_roster.sort_values("Name", inplace=True)
            st.dataframe(df_roster, use_container_width=True, hide_index=True)
            st.metric("Roster Size", len(roster_rows))

    with tab_stats:
        with st.spinner("Loading team statistics..."):
            all_players = fetch_competition_players(comp_uuid)
            players_lookup = {p["uuid"]: p for p in all_players}
            boxscore_data = fetch_boxscore(comp_uuid, per_page=100, max_pages=30)

        team_box = [row for row in boxscore_data if row.get("competition_team_uuid") == team_uuid]

        if not team_box:
            st.info("No boxscore data found for this team.")
        else:
            player_stats = aggregate_player_stats(team_box, players_lookup)

            stats_rows = []
            for p_uuid, s in player_stats.items():
                games = max(s["games"], 1)
                reb = s["offensive_rebound"] + s["defensive_rebound"]
                stats_rows.append({
                    "Player": s["name"],
                    "Role": s["role"],
                    "GP": s["games"],
                    "MIN": round(s["minute"] / games, 1),
                    "PPG": round(s["pts"] / games, 1),
                    "RPG": round(reb / games, 1),
                    "APG": round(s["assist"] / games, 1),
                    "SPG": round(s["steal"] / games, 1),
                    "BPG": round(s["block"] / games, 1),
                    "TPG": round(s["turnover"] / games, 1),
                    "FG%": round(s["fg_made"] / max(s["fg_all"], 1) * 100, 1),
                    "3P%": round(s["pts3_made"] / max(s["pts3_all"], 1) * 100, 1),
                    "FT%": round(s["ft_made"] / max(s["ft_all"], 1) * 100, 1),
                })

            df_stats = pd.DataFrame(stats_rows)
            df_stats.sort_values("PPG", ascending=False, inplace=True)
            st.dataframe(df_stats, use_container_width=True, hide_index=True)

            top_scorers = df_stats.head(10)
            fig = px.bar(
                top_scorers, x="Player", y="PPG",
                title="Points Per Game — Top Scorers",
                color="PPG",
                color_continuous_scale="Blues",
                text="PPG"
            )
            fig.update_layout(
                xaxis_tickangle=-45,
                height=450,
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
            )
            fig.update_traces(textposition="outside")
            st.plotly_chart(fig, use_container_width=True)

            if len(df_stats) >= 3:
                fig2 = px.scatter(
                    df_stats, x="PPG", y="RPG", size="APG",
                    hover_name="Player", color="Role",
                    title="Player Impact: Points vs Rebounds (size = Assists)",
                    size_max=25
                )
                fig2.update_layout(
                    height=400,
                    plot_bgcolor="rgba(0,0,0,0)",
                    paper_bgcolor="rgba(0,0,0,0)",
                )
                st.plotly_chart(fig2, use_container_width=True)


elif view_mode == "Player View":
    st.markdown('<p class="main-header">Player View</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Search and analyze individual player performance</p>', unsafe_allow_html=True)

    with st.spinner("Loading players..."):
        all_players = fetch_competition_players(comp_uuid)

    if not all_players:
        st.warning("No players found for this competition.")
        st.stop()

    player_options = sorted(
        [f"{p.get('first_name','')} {p.get('last_name','')}" for p in all_players]
    )

    mapped_names = list(PLAYER_ID_MAP.keys())
    available_mapped = [n for n in mapped_names if n in player_options]

    search_query = st.text_input("🔍 Search Player", placeholder="Type a player name...")

    if search_query:
        filtered = [n for n in player_options if search_query.lower() in n.lower()]
    else:
        filtered = player_options

    if not filtered:
        st.info("No players match your search.")
        st.stop()

    selected_player_name = st.selectbox("Select Player", filtered)

    selected_player = next(
        (p for p in all_players
         if f"{p.get('first_name','')} {p.get('last_name','')}" == selected_player_name),
        None
    )

    if not selected_player:
        st.stop()

    p_uuid = selected_player["uuid"]

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(f'<div class="metric-card"><div class="metric-label">Player</div><div class="metric-value" style="font-size:1rem">{selected_player_name}</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="metric-card"><div class="metric-label">Role</div><div class="metric-value">{selected_player.get("role", "—")}</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="metric-card"><div class="metric-label">Nationality</div><div class="metric-value">{selected_player.get("nationality", "—")}</div></div>', unsafe_allow_html=True)
    with col4:
        bdate = selected_player.get("birthdate", "")
        st.markdown(f'<div class="metric-card"><div class="metric-label">Birthdate</div><div class="metric-value" style="font-size:1rem">{bdate or "—"}</div></div>', unsafe_allow_html=True)

    mapped_id = None
    for name, pid in PLAYER_ID_MAP.items():
        if name.lower() in selected_player_name.lower() or selected_player_name.lower() in name.lower():
            mapped_id = pid
            break
    if mapped_id:
        st.caption(f"Internal ID mapping: {mapped_id}")

    st.markdown("---")

    tab_avg, tab_gamelog = st.tabs(["📊 Season Averages", "📋 Game Log"])

    with tab_avg:
        with st.spinner("Loading boxscore data..."):
            boxscore_data = fetch_boxscore(comp_uuid, per_page=100, max_pages=30)

        player_box = [row for row in boxscore_data if row.get("player_uuid") == p_uuid]

        if not player_box:
            st.info("No boxscore data found for this player in the current competition.")
        else:
            total_games = len(player_box)
            total_pts = sum(r.get("pts", 0) or 0 for r in player_box)
            total_reb = sum((r.get("offensive_rebound", 0) or 0) + (r.get("defensive_rebound", 0) or 0) for r in player_box)
            total_ast = sum(r.get("assist", 0) or 0 for r in player_box)
            total_stl = sum(r.get("steal", 0) or 0 for r in player_box)
            total_blk = sum(r.get("block", 0) or 0 for r in player_box)
            total_min = sum(r.get("minute", 0) or 0 for r in player_box)
            total_to = sum(r.get("turnover", 0) or 0 for r in player_box)

            total_fg_made = sum(r.get("fg_made", 0) or 0 for r in player_box)
            total_fg_all = sum(r.get("fg_all", 0) or 0 for r in player_box)
            total_3p_made = sum(r.get("pts3_made", 0) or 0 for r in player_box)
            total_3p_all = sum(r.get("pts3_all", 0) or 0 for r in player_box)
            total_ft_made = sum(r.get("ft_made", 0) or 0 for r in player_box)
            total_ft_all = sum(r.get("ft_all", 0) or 0 for r in player_box)

            c1, c2, c3, c4, c5, c6 = st.columns(6)
            with c1:
                st.metric("Games", total_games)
            with c2:
                st.metric("PPG", f"{total_pts/total_games:.1f}")
            with c3:
                st.metric("RPG", f"{total_reb/total_games:.1f}")
            with c4:
                st.metric("APG", f"{total_ast/total_games:.1f}")
            with c5:
                st.metric("SPG", f"{total_stl/total_games:.1f}")
            with c6:
                st.metric("MPG", f"{total_min/total_games:.1f}")

            c7, c8, c9, c10 = st.columns(4)
            with c7:
                fg_pct = round(total_fg_made / max(total_fg_all, 1) * 100, 1)
                st.metric("FG%", f"{fg_pct}%")
            with c8:
                p3_pct = round(total_3p_made / max(total_3p_all, 1) * 100, 1)
                st.metric("3P%", f"{p3_pct}%")
            with c9:
                ft_pct = round(total_ft_made / max(total_ft_all, 1) * 100, 1)
                st.metric("FT%", f"{ft_pct}%")
            with c10:
                st.metric("TO/G", f"{total_to/total_games:.1f}")

            categories = ["PPG", "RPG", "APG", "SPG", "BPG"]
            values = [
                total_pts / total_games,
                total_reb / total_games,
                total_ast / total_games,
                total_stl / total_games,
                total_blk / total_games,
            ]

            fig_radar = go.Figure()
            fig_radar.add_trace(go.Scatterpolar(
                r=values + [values[0]],
                theta=categories + [categories[0]],
                fill="toself",
                name=selected_player_name,
                line=dict(color="#3b82f6"),
                fillcolor="rgba(59,130,246,0.2)"
            ))
            fig_radar.update_layout(
                polar=dict(radialaxis=dict(visible=True, range=[0, max(values) * 1.3 if values else 10])),
                title=f"{selected_player_name} — Season Averages",
                height=400,
                showlegend=False,
            )
            st.plotly_chart(fig_radar, use_container_width=True)

    with tab_gamelog:
        with st.spinner("Loading game log..."):
            boxscore_data = fetch_boxscore(comp_uuid, per_page=100, max_pages=30)

        player_box = [row for row in boxscore_data if row.get("player_uuid") == p_uuid]

        if not player_box:
            st.info("No game log data found.")
        else:
            schedules = fetch_schedule(comp_uuid)
            sched_lookup = {s["uuid"]: s for s in schedules}

            log_rows = []
            for row in player_box:
                sched = sched_lookup.get(row.get("schedule_uuid"), {})
                home = sched.get("home_team", {}).get("team_name", "?")
                away = sched.get("away_team", {}).get("team_name", "?")
                date = (sched.get("start_time") or "")[:10]
                h_score = sched.get("home_score", "")
                a_score = sched.get("away_score", "")

                reb = (row.get("offensive_rebound", 0) or 0) + (row.get("defensive_rebound", 0) or 0)
                log_rows.append({
                    "Date": date,
                    "Matchup": f"{home} vs {away}",
                    "Score": f"{h_score}-{a_score}" if h_score != "" else "—",
                    "MIN": row.get("minute", 0) or 0,
                    "PTS": row.get("pts", 0) or 0,
                    "REB": reb,
                    "AST": row.get("assist", 0) or 0,
                    "STL": row.get("steal", 0) or 0,
                    "BLK": row.get("block", 0) or 0,
                    "TO": row.get("turnover", 0) or 0,
                    "FG": f"{row.get('fg_made',0) or 0}/{row.get('fg_all',0) or 0}",
                    "3P": f"{row.get('pts3_made',0) or 0}/{row.get('pts3_all',0) or 0}",
                    "FT": f"{row.get('ft_made',0) or 0}/{row.get('ft_all',0) or 0}",
                })

            df_log = pd.DataFrame(log_rows)
            df_log.sort_values("Date", ascending=False, inplace=True)
            st.dataframe(df_log, use_container_width=True, hide_index=True)

            if len(log_rows) > 1:
                df_trend = pd.DataFrame(log_rows).sort_values("Date")
                fig_trend = go.Figure()
                fig_trend.add_trace(go.Scatter(
                    x=df_trend["Date"], y=df_trend["PTS"],
                    mode="lines+markers", name="Points",
                    line=dict(color="#3b82f6", width=2)
                ))
                fig_trend.add_trace(go.Scatter(
                    x=df_trend["Date"], y=df_trend["REB"],
                    mode="lines+markers", name="Rebounds",
                    line=dict(color="#10b981", width=2)
                ))
                fig_trend.add_trace(go.Scatter(
                    x=df_trend["Date"], y=df_trend["AST"],
                    mode="lines+markers", name="Assists",
                    line=dict(color="#f59e0b", width=2)
                ))
                fig_trend.update_layout(
                    title="Game-by-Game Trend",
                    xaxis_title="Date", yaxis_title="Count",
                    height=400,
                    plot_bgcolor="rgba(0,0,0,0)",
                    paper_bgcolor="rgba(0,0,0,0)",
                )
                st.plotly_chart(fig_trend, use_container_width=True)
