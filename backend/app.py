import os
import re
from pathlib import Path


def _load_local_env():
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue

        os.environ[key] = value.strip().strip('"').strip("'")


_load_local_env()

from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.referencia import referencia_bp
from routes.admin import admin_bp

# Build do React (gerado por `npm run build` no frontend) — servido pelo proprio Flask em
# producao, assim o site todo (API + front) fica num unico servico/URL e sem CORS entre eles.
FRONTEND_BUILD_DIR = Path(__file__).resolve().parent.parent / "frontend" / "build"


def _load_allowed_origins():
    origins = [
        re.compile(r"^http://localhost(:\d+)?$"),
        re.compile(r"^http://127\.0\.0\.1(:\d+)?$"),
    ]

    extra_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    for origin in extra_origins.split(","):
        origin = origin.strip()
        if origin:
            origins.append(origin)

    return origins


app = Flask(__name__, static_folder=str(FRONTEND_BUILD_DIR), static_url_path="")
CORS(
    app,
    resources={
        r"/*": {
            "origins": _load_allowed_origins()
        }
    },
)

app.register_blueprint(referencia_bp)
app.register_blueprint(admin_bp)


@app.route("/status")
def status():
    return {"status": "ok"}


@app.route("/")
def servir_frontend():
    # Arquivos estaticos (static/js, static/css, manifest.json, ...) ja sao servidos
    # automaticamente pelo Flask por causa do static_folder/static_url_path acima — essa rota
    # cobre so o "/" em si, que precisa devolver o index.html do build.
    return send_from_directory(FRONTEND_BUILD_DIR, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5001, threaded=True)
