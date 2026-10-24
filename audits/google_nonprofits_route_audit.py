"""Read-only audit of public links on destekol.org.

Fetches sitemap URLs and follows links found in rendered server HTML. It sends
GET requests only; it does not submit forms or execute client-side actions.
"""

from __future__ import annotations

import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path


BASE = "https://destekol.org"
ROOT = Path(__file__).resolve().parent
USER_AGENT = "Destekol public link audit/2026-10-24"
MAX_URLS = 450
WORKERS = 5
TIMEOUT = 20


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.buttons: list[dict[str, str]] = []
        self.forms: list[dict[str, str]] = []
        self._button: dict[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.links.append(values["href"] or "")
        elif tag == "button":
            self._button = {
                "type": values.get("type") or "",
                "aria_label": values.get("aria-label") or "",
                "title": values.get("title") or "",
                "text": "",
            }
            self.buttons.append(self._button)
        elif tag == "form":
            self.forms.append(
                {
                    "method": values.get("method") or "GET",
                    "action": values.get("action") or "",
                }
            )

    def handle_data(self, data: str) -> None:
        if self._button is not None:
            self._button["text"] += data

    def handle_endtag(self, tag: str) -> None:
        if tag == "button" and self._button is not None:
            self._button["text"] = " ".join(self._button["text"].split())
            self._button = None


def normalize(url: str, base: str = BASE) -> str | None:
    try:
        full = urllib.parse.urljoin(base, url)
        parts = urllib.parse.urlsplit(full)
        if parts.scheme not in ("http", "https"):
            return None
        return urllib.parse.urlunsplit(
            (parts.scheme, parts.netloc.lower(), parts.path or "/", parts.query, "")
        )
    except ValueError:
        return None


def internal(url: str) -> bool:
    return urllib.parse.urlsplit(url).hostname == "destekol.org"


def safe_to_open(url: str) -> bool:
    path = urllib.parse.urlsplit(url).path.lower()
    return not any(
        segment in path
        for segment in ("/admin", "/api/", "/logout", "/signout", "/delete", "/checkout", "/payment")
    )


def fetch(url: str) -> dict:
    started = time.monotonic()
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xml,text/xml,*/*"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            body = response.read(2_000_000)
            status = response.status
            final_url = response.url
            content_type = response.headers.get("Content-Type", "")
    except urllib.error.HTTPError as error:
        body = error.read(100_000)
        status = error.code
        final_url = error.url
        content_type = error.headers.get("Content-Type", "")
    except Exception as error:
        return {
            "url": url,
            "status": None,
            "final_url": "",
            "content_type": "",
            "bytes": 0,
            "seconds": round(time.monotonic() - started, 2),
            "error": f"{type(error).__name__}: {error}",
            "links": [],
            "buttons": [],
            "forms": [],
        }
    links: list[str] = []
    buttons: list[dict[str, str]] = []
    forms: list[dict[str, str]] = []
    if "html" in content_type.lower():
        parser = LinkParser()
        parser.feed(body.decode("utf-8", errors="replace"))
        links = [link for raw in parser.links if (link := normalize(raw, final_url))]
        buttons = parser.buttons
        forms = parser.forms
    return {
        "url": url,
        "status": status,
        "final_url": final_url,
        "content_type": content_type,
        "bytes": len(body),
        "seconds": round(time.monotonic() - started, 2),
        "error": "",
        "links": sorted(set(links)),
        "buttons": buttons,
        "forms": forms,
    }


def sitemap_urls() -> list[str]:
    with urllib.request.urlopen(
        urllib.request.Request(BASE + "/sitemap.xml", headers={"User-Agent": USER_AGENT}),
        timeout=TIMEOUT,
    ) as response:
        xml = response.read()
    root = ET.fromstring(xml)
    return sorted(
        {
            text
            for element in root.iter()
            if element.tag.endswith("}loc") or element.tag == "loc"
            if (text := normalize((element.text or "").strip())) is not None
        }
    )


def main() -> None:
    seeds = sitemap_urls()
    browser_seeds = {
        url
        for line in (ROOT / "browser_discovered_query_urls_2026-10-24.txt").read_text(encoding="utf-8").splitlines()
        if (url := normalize(line.strip())) and not line.startswith("#") and internal(url)
    }
    queued = set(seeds) | browser_seeds | {BASE + "/"}
    results: dict[str, dict] = {}
    external: set[str] = set()
    unsafe: set[str] = set()
    rounds = 0
    while queued and len(results) < MAX_URLS:
        current = sorted(queued - results.keys())[:MAX_URLS - len(results)]
        if not current:
            break
        queued.clear()
        rounds += 1
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            futures = {pool.submit(fetch, url): url for url in current}
            for future in as_completed(futures):
                result = future.result()
                results[result["url"]] = result
                for link in result["links"]:
                    if internal(link):
                        if safe_to_open(link) and link not in results:
                            queued.add(link)
                        elif not safe_to_open(link):
                            unsafe.add(link)
                    else:
                        external.add(link)
        print(f"round={rounds} tested={len(results)} pending={len(queued - results.keys())}", flush=True)

    rows = [results[url] for url in sorted(results)]
    csv_path = ROOT / "google_nonprofits_routes_2026-10-24.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(
            output,
            fieldnames=["url", "status", "final_url", "content_type", "bytes", "seconds", "error", "link_count", "button_count", "form_count"],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({
                **{key: row[key] for key in ("url", "status", "final_url", "content_type", "bytes", "seconds", "error")},
                "link_count": len(row["links"]),
                "button_count": len(row["buttons"]),
                "form_count": len(row["forms"]),
            })

    details_path = ROOT / "google_nonprofits_routes_2026-10-24.json"
    details_path.write_text(
        json.dumps({"sitemap_count": len(seeds), "browser_query_seed_count": len(browser_seeds), "results": rows, "external_links": sorted(external), "skipped_unsafe": sorted(unsafe)}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    by_status: dict[str, int] = {}
    for row in rows:
        key = str(row["status"]) if row["status"] is not None else "error"
        by_status[key] = by_status.get(key, 0) + 1
    print(json.dumps({
        "sitemap_count": len(seeds),
        "tested": len(rows),
        "status_counts": by_status,
        "redirects": [
            {"url": row["url"], "final_url": row["final_url"]}
            for row in rows if row["final_url"] and row["url"] != row["final_url"]
        ],
        "failures": [
            {"url": row["url"], "status": row["status"], "error": row["error"]}
            for row in rows if row["status"] is None or row["status"] >= 400
        ],
        "external_links": len(external),
        "skipped_unsafe": len(unsafe),
        "pending": len(queued - results.keys()),
        "csv": str(csv_path),
        "json": str(details_path),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.exit(main())
