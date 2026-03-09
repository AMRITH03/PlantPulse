import os
import httpx
from dotenv import load_dotenv

load_dotenv()

THINGSBOARD_URL = os.getenv("THINGSBOARD_URL", "https://thingsboard.cloud")
THINGSBOARD_USERNAME = os.getenv("THINGSBOARD_USERNAME")  # Tenant admin email
THINGSBOARD_PASSWORD = os.getenv("THINGSBOARD_PASSWORD")  # Tenant admin password
THINGSBOARD_DEVICE_ID = os.getenv("THINGSBOARD_DEVICE_ID")  # ESP32 device ID in ThingsBoard

# Cache the JWT token
_cached_token: str | None = None


async def _get_auth_token() -> str:
    """Authenticate with ThingsBoard and get a JWT token."""
    global _cached_token
    if _cached_token:
        return _cached_token

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{THINGSBOARD_URL}/api/auth/login",
            json={
                "username": THINGSBOARD_USERNAME,
                "password": THINGSBOARD_PASSWORD,
            },
        )
        resp.raise_for_status()
        _cached_token = resp.json()["token"]
        return _cached_token


def clear_token_cache():
    """Clear cached token so next call re-authenticates."""
    global _cached_token
    _cached_token = None


async def send_rpc_command(device_id: str, light_on: bool = False, water_plant: bool = False) -> dict:
    target_device = device_id or THINGSBOARD_DEVICE_ID
    if not target_device:
        raise ValueError("No device_id provided and THINGSBOARD_DEVICE_ID not set in .env")

    # water_plant = not water_plant
    light_on = not light_on
    token = await _get_auth_token() 
    rpc_payload = {
        "method": "setControl",
        "params": {
            "light_on": light_on,
            "water_plant": water_plant,
        },
        "timeout": 5000,  # ms to wait for device response
        "retries" : 5
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{THINGSBOARD_URL}/api/plugins/rpc/oneway/{device_id}",
            json=rpc_payload,
            headers={"X-Authorization": f"Bearer {token}"},
            timeout=10.0,
        )

        # If 401, token expired — re-auth and retry once
        if resp.status_code == 401:
            clear_token_cache()
            token = await _get_auth_token()
            resp = await client.post(
                f"{THINGSBOARD_URL}/api/rpc/twoway/{target_device}",
                json=rpc_payload,
                headers={"X-Authorization": f"Bearer {token}"},
                timeout=10.0,
            )

        resp.raise_for_status()
        print(f"[ThingsBoard RPC] Sent to {target_device}: light_on={light_on}, water_plant={water_plant}")
        # twoway RPC returns empty body on success (200)
        return {"status": "ok", "light_on": light_on, "water_plant": water_plant}
