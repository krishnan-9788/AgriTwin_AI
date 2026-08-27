import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.get("http://localhost:8000/farms/1/digital-twin")
        print("Status:", res.status_code)
        print("Response:", res.text)

if __name__ == "__main__":
    asyncio.run(test())
