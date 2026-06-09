#!/usr/bin/env python3
"""
One-shot scraper: ejecuta scrape_grades, escribe JSON a stdout y termina.
El proceso muere completamente al finalizar — sin overhead cuando no se usa.
"""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import scrape_grades

async def main() -> None:
    user = os.environ.get("UPAO_USER")
    pwd  = os.environ.get("UPAO_PASS")
    result = await scrape_grades(user, pwd)
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()

asyncio.run(main())
