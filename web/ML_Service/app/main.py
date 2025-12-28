from fastapi import FastAPI, HTTPException, Query
from typing import List
from .predict import predict_comments
from .thread_scraper import scrape_thread
import re
from .tiktok_scraper import TiktokComment, Comments

app = FastAPI(title="Toxic Comment ML Service")

@app.post("/predict")
def predict(payload: dict):
    texts = payload["comments"]
    
    return {
        "results": predict_comments(texts)
    }

@app.get("/thread_comments")
def get_thread_comments(
    url: str = Query(..., description="Threads post URL"),
    limit: int = Query(0, ge=0, le=500)
):
    """
    GET /thread_comments?url=THREAD_URL&limit=100
    """

    try:
        data = scrape_thread(url, limit)

        # lấy text của thread + replies
        comments = []

        # thread text
        thread_text = data.get("thread", {}).get("text")
        if thread_text:
            comments.append(thread_text.strip())

        # replies text
        for r in data.get("replies", []):
            text = r.get("text")
            if text:
                comments.append(text.strip())

        return {
            "comments": comments
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ===================== API =====================
@app.get("/tiktok_comments")
def get_tiktok_comments(
    url: str = Query(..., description="TikTok post URL"),
    limit: int = Query(0, ge=0, le=500)
):
    """
    GET /tiktok_comments?url=TIKTOK_URL&limit=100
    Return: { comments: string[] }
    """

    try:
        aweme_id = extract_aweme_id(url)

        scraper = TiktokComment()

        comments_data: Comments = scraper(
            aweme_id=aweme_id,
            limit=limit if limit > 0 else None
        )

        comments: list[str] = []

        if comments_data and comments_data.comments:
            for c in comments_data.comments:
                text = c.comment
                if text:
                    comments.append(text.strip())

        return {
            "comments": comments
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================== HELPER =====================
def extract_aweme_id(tiktok_url: str) -> str:
    """
    Trích aweme_id từ URL TikTok
    Ví dụ:
    https://www.tiktok.com/@user/video/1234567890
    """
    match = re.search(r"/video/(\d+)", tiktok_url)
    if not match:
        raise ValueError("Invalid TikTok URL")
    return match.group(1)

#uvicorn app.main:app --reload