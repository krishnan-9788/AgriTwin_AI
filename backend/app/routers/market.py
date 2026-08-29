from fastapi import APIRouter, Depends, HTTPException
from ..services.market import get_market_prices
from ..routers.auth import get_current_user
from .. import models

router = APIRouter(tags=["market"])

@router.get("/market-prices")
def fetch_market_prices(
    state: str,
    commodity: str,
    district: str = "",
    limit: int = 10,
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch market prices from data.gov.in. 
    Requires authentication to protect the API key proxy.
    """
    if not state or not commodity:
        raise HTTPException(status_code=400, detail="State and commodity are required")
        
    result = get_market_prices(state, district, commodity, limit)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result

@router.get("/market-prices/test")
def test_market_api(current_user: models.User = Depends(get_current_user)):
    """
    Test endpoint for data.gov.in connectivity.
    """
    import urllib.request
    import json
    from ..config import settings
    
    api_key = settings.data_gov_api_key
    if not api_key or api_key == "YOUR_API_KEY":
        return {"status": "error", "message": "API Key not configured"}
        
    base_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    url = f"{base_url}?api-key={api_key}&format=json&limit=1"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            return {
                "status": "success",
                "http_status": response.status,
                "records_count": len(data.get("records", [])),
                "message": "Connected to data.gov.in successfully"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
