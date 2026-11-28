from __future__ import annotations

from flask import Blueprint, jsonify, render_template, send_file

from . import snapshot

bp = Blueprint("analytics", __name__, url_prefix="/analytics")


@bp.get("")
def dashboard():
    return render_template("analytics.html", status=snapshot.status())


@bp.get("/data.json")
def data():
    if not snapshot.LATEST.is_file():
        return jsonify({"error": "no_snapshot"}), 404
    resp = send_file(snapshot.LATEST, mimetype="application/json", max_age=0)
    resp.headers["Cache-Control"] = "no-store"
    return resp


@bp.post("/refresh")
def refresh():
    started = snapshot.run_in_background()
    return jsonify({"started": started, **snapshot.status()}), 202 if started else 409


@bp.get("/status")
def status():
    return jsonify(snapshot.status())
