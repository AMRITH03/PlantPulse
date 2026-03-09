import os
import httpx
from dotenv import load_dotenv

load_dotenv()

THINGSBOARD_URL = os.getenv("THINGSBOARD_URL", "https://thingsboard.cloud").rstrip("/")
THINGSBOARD_DEVICE_ID = os.getenv("THINGSBOARD_DEVICE_ID")  # ESP32 device ID in ThingsBoard

# Option 1 (recommended for OAuth/Google login): Personal Access Token generated from
# ThingsBoard Cloud UI → Profile → Personal Access Tokens → Add
THINGSBOARD_PAT = os.getenv("THINGSBOARD_PAT")

# Option 2 (fallback): username/password credentials
THINGSBOARD_USERNAME = os.getenv("THINGSBOARD_USERNAME")
THINGSBOARD_PASSWORD = os.getenv("THINGSBOARD_PASSWORD")

# Cache for password-based JWT token (not used when PAT is set)
_cached_token: str | None = None


async def _get_auth_token() -> str:
        return THINGSBOARD_PAT



def clear_token_cache():
    """Clear the cached password-based JWT token so the next call re-authenticates.
    Has no effect when using a Personal Access Token."""
    global _cached_token
    _cached_token = None


async def send_rpc_command(device_id: str, light_on: bool = False, water_plant: bool = False) -> dict:
    target_device = device_id or THINGSBOARD_DEVICE_ID
    if not target_device:
        raise ValueError("No device_id provided and THINGSBOARD_DEVICE_ID not set in .env")

    # water_plant = not water_plant
    light_on = not light_on
    token = await _get_auth_token() 

    # --- ADD THIS DEBUG CHECK ---
    if not token:
        print("❌ ERROR: Token is empty or None. Check your .env file and load_dotenv() path.")
        return {"status": "error", "message": "Missing token"}
    else:
        print(f"🔑 Using token starting with: {token[:10]}... (Length: {len(token)})")
    rpc_payload = {
        "method": "setControl",
        "params": {
            "light_on": light_on,
            "water_plant": water_plant,
        },
        "timeout": 5000,  # ms to wait for device response
        "retries" : 5
    }

    rpc_url = f"{THINGSBOARD_URL}/api/rpc/oneway/{target_device}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            rpc_url,
            json=rpc_payload,
            headers={"X-Authorization": f"ApiKey {token}"},
            timeout=10.0,
        )

        # If 401 and using username/password auth, the cached JWT may have expired —
        # clear the cache, fetch a fresh token, and retry once.
        # Skip retry when using a PAT (same static token would be returned again).
        if resp.status_code == 401 and not THINGSBOARD_PAT:
            clear_token_cache()
            token = await _get_auth_token()
            resp = await client.post(
                rpc_url,
                json=rpc_payload,
                headers={"X-Authorization": f"ApiKey {token}"},
                timeout=10.0,
            )

        resp.raise_for_status()
        print(f"[ThingsBoard RPC] Sent to {target_device}: light_on={light_on}, water_plant={water_plant}")
        # twoway RPC returns empty body on success (200)
        return {"status": "ok", "light_on": light_on, "water_plant": water_plant}
