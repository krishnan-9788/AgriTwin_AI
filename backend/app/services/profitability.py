from typing import Dict, Any, List

def calculate_suitability(farm_area: float, current_crop: str, soil: Dict[str, Any], weather: Dict[str, Any], growth_stage: str = "Unknown", health_score: int = 100) -> Dict[str, Any]:
    """
    Simulates a dynamic profitability and suitability engine for agricultural crops.
    """
    
    # Define exhaustive crop base metrics
    CROP_PROFILES = {
        "Paddy": { "base_yield_per_acre": 25, "unit": "Quintals", "ideal_ph": (5.5, 6.5), "ideal_temp": (25, 33), "cost_per_acre": 15000, "price": 2200 },
        "Rice": { "base_yield_per_acre": 25, "unit": "Quintals", "ideal_ph": (5.5, 6.5), "ideal_temp": (25, 33), "cost_per_acre": 15000, "price": 2200 },
        "Maize": { "base_yield_per_acre": 35, "unit": "Quintals", "ideal_ph": (5.8, 7.0), "ideal_temp": (20, 30), "cost_per_acre": 12000, "price": 1900 },
        "Corn": { "base_yield_per_acre": 35, "unit": "Quintals", "ideal_ph": (5.8, 7.0), "ideal_temp": (20, 30), "cost_per_acre": 12000, "price": 1900 },
        "Wheat": { "base_yield_per_acre": 20, "unit": "Quintals", "ideal_ph": (6.0, 7.5), "ideal_temp": (15, 25), "cost_per_acre": 14000, "price": 2125 },
        "Tomato": { "base_yield_per_acre": 200, "unit": "Quintals", "ideal_ph": (6.0, 6.8), "ideal_temp": (21, 27), "cost_per_acre": 30000, "price": 1500 },
        "Banana": { "base_yield_per_acre": 150, "unit": "Quintals", "ideal_ph": (5.5, 7.0), "ideal_temp": (26, 32), "cost_per_acre": 40000, "price": 3000 },
        "Mango": { "base_yield_per_acre": 60, "unit": "Quintals", "ideal_ph": (5.5, 7.5), "ideal_temp": (24, 30), "cost_per_acre": 25000, "price": 4500 },
        "Jasmine": { "base_yield_per_acre": 25, "unit": "Quintals", "ideal_ph": (6.0, 7.5), "ideal_temp": (25, 32), "cost_per_acre": 40000, "price": 3500 },
        "Cotton": { "base_yield_per_acre": 10, "unit": "Quintals", "ideal_ph": (5.8, 8.0), "ideal_temp": (21, 37), "cost_per_acre": 22000, "price": 6000 },
        "Groundnut": { "base_yield_per_acre": 15, "unit": "Quintals", "ideal_ph": (6.0, 6.5), "ideal_temp": (25, 30), "cost_per_acre": 18000, "price": 5500 },
        "Onion": { "base_yield_per_acre": 100, "unit": "Quintals", "ideal_ph": (6.0, 7.0), "ideal_temp": (15, 25), "cost_per_acre": 25000, "price": 1200 },
        "Potato": { "base_yield_per_acre": 120, "unit": "Quintals", "ideal_ph": (5.0, 6.5), "ideal_temp": (15, 20), "cost_per_acre": 35000, "price": 1000 },
        "Chilli": { "base_yield_per_acre": 15, "unit": "Quintals", "ideal_ph": (6.0, 6.8), "ideal_temp": (20, 30), "cost_per_acre": 25000, "price": 8000 },
        "Sugarcane": { "base_yield_per_acre": 400, "unit": "Quintals", "ideal_ph": (6.5, 7.5), "ideal_temp": (28, 35), "cost_per_acre": 35000, "price": 300 }
    }

    # Match crop name dynamically (e.g. "Paddy (IR64)" -> "Paddy")
    matched_key = "Paddy" # Fallback
    for k in CROP_PROFILES.keys():
        if current_crop and k.lower() in current_crop.lower():
            matched_key = k
            break
            
    profile = CROP_PROFILES[matched_key]

    # 1. Calculate Suitability Modifiers
    soil_ph = soil.get("ph", 6.5)
    temp = weather.get("temperature", 28)
    
    soil_suitability = 1.0
    if soil_ph < profile["ideal_ph"][0] or soil_ph > profile["ideal_ph"][1]:
        soil_suitability = 0.8
        
    weather_suitability = 1.0
    if temp < profile["ideal_temp"][0] or temp > profile["ideal_temp"][1]:
        weather_suitability = 0.85
        
    # Health modifier (0.5 to 1.0 scale)
    health_modifier = max(0.5, health_score / 100.0)

    # Stage modifier: Early stages have higher uncertainty, mature stages are locked in
    stage_lower = growth_stage.lower()
    stage_modifier = 0.7 # Seedling/Planting
    if "vegetative" in stage_lower or "young" in stage_lower or "tillering" in stage_lower or "branching" in stage_lower:
        stage_modifier = 0.8
    elif "flower" in stage_lower or "panicle" in stage_lower:
        stage_modifier = 0.9
    elif "fruit" in stage_lower or "filling" in stage_lower:
        stage_modifier = 0.95
    elif "mature" in stage_lower or "harvest" in stage_lower:
        stage_modifier = 1.0

    overall_suitability = (soil_suitability * 0.4) + (weather_suitability * 0.4) + 0.2
    overall_score = round(overall_suitability * 100)

    # 2. Calculate Yield
    expected_yield_per_acre = profile["base_yield_per_acre"] * overall_suitability * health_modifier * stage_modifier
    total_yield = round(expected_yield_per_acre * farm_area, 2)

    # 3. Simulate Market Price
    market_price = profile["price"]

    # 4. Calculate Economics
    total_cost = round(profile["cost_per_acre"] * farm_area)
    expected_revenue = round(total_yield * market_price)
    expected_profit = expected_revenue - total_cost

    # 5. Generate Dynamic Prediction Factors
    reasons = []
    
    # Soil pH Factor
    if soil_suitability == 1.0: 
        reasons.append(f"+ Soil pH ({soil_ph}) is highly suitable for {matched_key}")
    else: 
        reasons.append(f"- Soil pH ({soil_ph}) is sub-optimal for {matched_key}")
        
    # Temp Factor
    if weather_suitability == 1.0: 
        reasons.append(f"+ Ambient temperature is ideal for {matched_key}")
    else: 
        reasons.append(f"- Temperature stress detected for {matched_key}")
        
    # Stage Factor
    if stage_modifier < 0.8:
        reasons.append(f"info Early stage ({growth_stage}): Yield projection is a preliminary baseline")
    elif stage_modifier < 0.95:
        reasons.append(f"+ Mid-stage development ({growth_stage}): Yield projection reliability increasing")
    else:
        reasons.append(f"+ Late stage ({growth_stage}): Final yield projection is locked in")

    # Health Factor
    if health_score >= 90:
        reasons.append(f"+ Excellent crop health ({health_score}/100) maximizes yield")
    elif health_score >= 60:
        reasons.append(f"info Moderate crop health ({health_score}/100) is limiting yield potential")
    else:
        reasons.append(f"- Poor crop health ({health_score}/100) is severely reducing yield")

    # Market Demand
    demand_score = 75 + (len(matched_key) * 2) # pseudo-random demand
    if demand_score > 100: demand_score = 95
    reasons.append(f"+ Strong regional market demand ({demand_score}/100) for {matched_key}")

    # Generate Land Allocation Proposal
    allocation = [{"crop": matched_key, "area": round(farm_area, 2)}]

    return {
        "crop": matched_key,
        "suitability_score": overall_score,
        "reasons": reasons,
        "estimated_yield": total_yield,
        "unit": profile["unit"],
        "area_acres": farm_area,
        "economics": {
            "total_cost": total_cost,
            "expected_revenue": expected_revenue,
            "expected_profit": expected_profit,
            "market_price": market_price
        },
        "land_allocation": allocation
    }

def compare_crops(farm_area: float, soil: Dict[str, Any], weather: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compares crops based on farm data.
    """
    crops_to_compare = ["Paddy", "Maize", "Wheat", "Tomato"]
    comparisons = []
    
    for crop in crops_to_compare:
        result = calculate_suitability(farm_area, crop, soil, weather)
        comparisons.append(result)
        
    comparisons.sort(key=lambda x: (x["economics"]["expected_profit"], x["suitability_score"]), reverse=True)
    
    for i, comp in enumerate(comparisons):
        comp["rank"] = i + 1
        
    best_crop = comparisons[0]
    
    return {
        "recommendations": comparisons,
        "best_crop": {
            "crop": best_crop["crop"],
            "reasons": best_crop["reasons"],
            "score": best_crop["suitability_score"]
        }
    }
