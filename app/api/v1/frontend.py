from flask import Blueprint, render_template

front_bp = Blueprint("front", __name__)

@front_bp.get("/")
def index():
    return render_template("index.html")