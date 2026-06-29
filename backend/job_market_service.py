import os
import requests
from datetime import datetime

from geopy.geocoders import Nominatim
from geopy.distance import geodesic

APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")

geolocator = Nominatim(
    user_agent="vista_iq_job_market"
)

def search_jobs(
    role,
    location="",
    lat=None,
    lng=None,
    page=1
):

    if not role:
        role = ""

    try:

        params = {
            "app_id": APP_ID,
            "app_key": APP_KEY,
            "results_per_page": 20,
            "content-type": "application/json"
        }

        if role:
            params["what"] = role

        # Exact location filtering only when GPS not used
        if location:
            params["where"] = location

        response = requests.get(
            f"https://api.adzuna.com/v1/api/jobs/in/search/{page}",
            params=params,
            timeout=15
        )

        response.raise_for_status()

        data = response.json()

        # Fallback search if no jobs found

        if data.get("count", 0) < 20 and location:

            print(f"No jobs in {location}, searching nearby...")

            fallback_params = {
                "app_id": APP_ID,
                "app_key": APP_KEY,
                "results_per_page": 20,
                "content-type": "application/json"
            }

            if role:
                fallback_params["what"] = role

            fallback_response = requests.get(
                f"https://api.adzuna.com/v1/api/jobs/in/search/{page}",
                params=fallback_params,
                timeout=15
            )

            fallback_response.raise_for_status()

            fallback_data = fallback_response.json()

            existing_urls = {
                job.get("redirect_url")
                for job in data.get("results", [])
            }

            for job in fallback_data.get("results", []):

                if job.get("redirect_url") not in existing_urls:

                    data["results"].append(job)

            data["count"] = len(data["results"])

        jobs = []

        for job in data.get("results", []):

            distance_km = None

            try:

                if lat and lng:

                    job_location = (
                        job.get("location", {})
                        .get("display_name", "")
                        .split(",")[0]
                        .strip()
                    )

                    location_data = geolocator.geocode(
                        job_location,
                        timeout=5
                    )

                    if location_data:

                        distance_km = round(
                            geodesic(
                                (lat, lng),
                                (
                                    location_data.latitude,
                                    location_data.longitude
                                )
                            ).km,
                            1
                        )

            except Exception as e:
                print("DISTANCE ERROR:", e)

            jobs.append({
                "title": job.get("title", "Unknown Role"),

                "distance_km": distance_km,

                "company": {
                    "display_name":
                    job.get("company", {}).get(
                        "display_name",
                        "Unknown Company"
                    )
                },

                "location": {
                    "display_name":
                    job.get("location", {}).get(
                        "display_name",
                        "Unknown Location"
                    )
                },

                "salary_min":
                job.get("salary_min"),

                "salary_max":
                job.get("salary_max"),

                "description":
                job.get("description", ""),

                "redirect_url":
                job.get("redirect_url", "#"),

                "created":
                job.get("created")

            })

        jobs.sort(
            key=lambda x: (
                0 if (
                    location and
                    location.lower()
                    in x["location"]["display_name"].lower()
                ) else 1,

                x["distance_km"]
                if x["distance_km"] is not None
                else 999999,

                -datetime.fromisoformat(
                    x["created"].replace("Z", "+00:00")
                ).timestamp()
                if x.get("created")
                else 0
            )
        )

        return {
            "count": data.get("count", 0),
            "results": jobs
        }

    except Exception as e:

        return {
            "error": str(e),
            "count": 0,
            "results": []
        }
    
