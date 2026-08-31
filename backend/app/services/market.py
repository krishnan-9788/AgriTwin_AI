import urllib.request
import urllib.parse
import json
from ..config import settings

import logging

logger = logging.getLogger(__name__)

def get_market_prices(state: str, district: str, commodity: str, limit: int = 20):
    """
    Fetches market prices from data.gov.in Mandi API with robust fallbacks.
    """
    api_key = settings.data_gov_api_key
    
    if not api_key or api_key == "YOUR_API_KEY":
        logger.warning("Market API key not configured")
        return {
            "success": False,
            "records": [],
            "count": 0,
            "error": "Market API key not configured",
            "source": "data.gov.in"
        }
        
    # Standardize common crop names to Mandi commodity names
    commodity_mapping = {
        "paddy": "Rice",
        "rice": "Rice",
        "corn": "Maize",
        "maize": "Maize",
        "wheat": "Wheat",
        "cotton": "Cotton",
        "tomato": "Tomato",
        "onion": "Onion"
    }
    
    mapped_commodity = commodity_mapping.get(commodity.lower(), commodity.title())
    
    # Title case for exact matching with data.gov.in
    state = state.title() if state else ""
    district = district.title() if district else ""
    
    # Base URL for the Mandi dataset
    base_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    
    def fetch_records(st: str, dist: str, comm: str):
        params = {
            "api-key": api_key,
            "format": "json",
            "limit": limit,
            "offset": 0
        }
        
        # Add valid filters only
        if st:
            params["filters[state]"] = st
        if dist:
            params["filters[district]"] = dist
        if comm:
            params["filters[commodity]"] = comm
            
        query_string = urllib.parse.urlencode(params)
        url = f"{base_url}?{query_string}"
        
        # Log securely
        secure_query = urllib.parse.urlencode({k: v for k, v in params.items() if k != "api-key"})
        logger.info(f"Market API Request: {base_url}?{secure_query}&api-key=***")
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=3) as response:
                if response.status != 200:
                    logger.error(f"Market API failed with status {response.status}")
                    return None
                    
                data = json.loads(response.read().decode('utf-8'))
                return data.get("records", [])
        except urllib.error.HTTPError as e:
            logger.error(f"Market API HTTP Error {e.code}: {e.read().decode('utf-8')[:200]}")
            return None
        except Exception as e:
            logger.error(f"Market API Network Error: {str(e)}")
            return None
            
    try:
        # Fallback Level 1: state + district + commodity
        records = fetch_records(state, district, mapped_commodity) if state and district else None
            
        # Fallback Level 2: state + commodity
        if (records is None or len(records) == 0) and state:
            logger.info("Level 1 failed. Trying Level 2: state + commodity")
            records = fetch_records(state, "", mapped_commodity)
            
        # Fallback Level 3: commodity only
        if records is None or len(records) == 0:
            logger.info("Level 2 failed. Trying Level 3: commodity only")
            records = fetch_records("", "", mapped_commodity)
            
        if records is None or len(records) == 0:
            logger.info("LIVE API returned no data. Generating DEMO/FALLBACK market data.")
            import datetime
            import random
            
            base_price = 2200
            if "maize" in mapped_commodity.lower() or "corn" in mapped_commodity.lower():
                base_price = 2100
            elif "rice" in mapped_commodity.lower() or "paddy" in mapped_commodity.lower():
                base_price = 3200
            elif "cotton" in mapped_commodity.lower():
                base_price = 6800
                
            today = datetime.datetime.now().strftime("%d/%m/%Y")
            records = [
                {
                    "state": state or "Tamil Nadu",
                    "district": district or "Erode",
                    "market": f"{district or 'Erode'} Central Mandi (DEMO)",
                    "commodity": mapped_commodity,
                    "variety": "Local",
                    "grade": "FAQ",
                    "arrival_date": today,
                    "min_price": str(base_price - random.randint(100, 300)),
                    "max_price": str(base_price + random.randint(100, 300)),
                    "modal_price": str(base_price)
                },
                {
                    "state": state or "Tamil Nadu",
                    "district": district or "Erode",
                    "market": f"{district or 'Erode'} APMC (DEMO)",
                    "commodity": mapped_commodity,
                    "variety": "Hybrid",
                    "grade": "FAQ",
                    "arrival_date": today,
                    "min_price": str(base_price - random.randint(50, 150)),
                    "max_price": str(base_price + random.randint(200, 400)),
                    "modal_price": str(base_price + 100)
                }
            ]
            source_type = "DEMO/FALLBACK"
        else:
            source_type = "LIVE - data.gov.in"
            
        return {
            "success": True,
            "filters": {
                "state": state,
                "district": district,
                "commodity": mapped_commodity
            },
            "records": records,
            "count": len(records),
            "source": source_type,
            "error": None
        }
    except Exception as e:
        logger.error(f"Market Service Exception: {str(e)}", exc_info=True)
        return {
            "success": False,
            "records": [],
            "count": 0,
            "error": "Internal server error while fetching market data",
            "source": "Internal"
        }
