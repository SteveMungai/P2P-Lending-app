# Vercel entrypoint.
# Vercel looks for a Flask object called `app` in a file like this one, so we simply
# re-export the app created in run.py. Nothing else belongs here.
from run import app  # noqa: F401
