import os
import csv
import json
import jmespath
import logging
from requests import Session, Response
from typing import Dict, Any, Optional, Iterator, List, Tuple
import argparse

# --- Cấu hình logging cơ bản ---
# (Để các lệnh logger.info của bạn có thể hiển thị)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# --- ĐỊNH NGHĨA CÁC LỚP DỮ LIỆU ---
# (Giả định dựa trên code của bạn, bạn có thể đã có các lớp Pydantic/Dataclass)
# Nếu bạn chưa có, các lớp tạm thời này sẽ giúp code chạy
class Comment:
    def __init__(self, username, comment, replies=None, **kwargs):
        self.username = username
        self.comment = comment
        # Đảm bảo replies là một list (có thể rỗng)
        self.replies = replies if replies else []
        # Gán các thuộc tính khác (nếu có)
        for key, value in kwargs.items():
            setattr(self, key, value)

class Comments:
    def __init__(self, comments, has_more=False, **kwargs):
        self.comments: List[Comment] = comments
        self.has_more = has_more
        # Gán các thuộc tính khác (nếu có)
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    @property
    def dict(self):
        # Tạo lại hàm .dict mà code gốc của bạn đã dùng (để tương thích)
        # Sửa lỗi: Phải là self.__dict__ (dùng dấu chấm)
        return self.__dict__

# --- LỚP TIKTOKCOMMENT (Nguyên bản của bạn) ---
class TiktokComment:
    BASE_URL: str = 'https://www.tiktok.com'
    API_URL: str = '%s/api' % BASE_URL

    def __init__(
        self: 'TiktokComment'
    ) -> None:
        self.__session: Session = Session()
    
    def __parse_comment(
        self: 'TiktokComment',
        data: Dict[str, Any]
    ) -> Comment:
        data: Dict[str, Any] = jmespath.search(
            """
            {
                comment_id: cid,
                username: user.unique_id,
                nickname: user.nickname,
                comment: text,
                create_time: create_time,
                avatar: user.avatar_thumb.url_list[0],
                total_reply: reply_comment_total
            }
            """ ,
            data
        )
    
        comment: Comment = Comment(
            **data,
            replies=list(
                self.get_all_replies(data.get('comment_id'))
            ) if data.get('total_reply') else []
        )

        logger.info('%s - %s : %s' % (
                comment.create_time,
                comment.username, 
                comment.comment
            )
        )

        return comment

    def get_all_replies(
        self: 'TiktokComment',
        comment_id: str
    ) -> Iterator[Comment]:
        page: int = 1
        while True:
            if(
                not (replies := self.get_replies(
                    comment_id=comment_id,
                    page=page
                ))
            ): break
            for reply in replies:
                yield reply
            
            page += 1

    def get_replies(
        self: 'TiktokComment',
        comment_id: str,
        size: Optional[int] = 50,
        page: Optional[int] = 1
    ):
        try:
            response: Response = self.__session.get(
                '%s/comment/list/reply/' % self.API_URL,
                params={
                    'aid': 1988,
                    'comment_id': comment_id,
                    'item_id': self.aweme_id,
                    'count': size,
                    'cursor': (page - 1) * size
                }
            )
            response.raise_for_status() # Kiểm tra lỗi HTTP
            
            # Trả về list rỗng nếu 'comments' không có hoặc là None
            json_data = response.json()
            comments_list = json_data.get('comments')
            if not comments_list:
                return []

            return [
                self.__parse_comment(
                    comment
                ) for comment in comments_list
            ]
        except Exception as e:
            logger.warning(f"Không thể lấy replies cho comment {comment_id} (page {page}): {e}")
            return []
    
    def get_all_comments(
        self: 'TiktokComment',
        aweme_id: str,
        limit: Optional[int] = None
    ) -> Comments:
        page = 1
        collected: List[Comment] = []

        while True:
            data = self.get_comments(
                aweme_id=aweme_id,
                page=page
            )

            if not data or not data.comments:
                break

            for c in data.comments:
                collected.append(c)

                # ✅ DỪNG NGAY KHI ĐỦ SIZE
                if limit and len(collected) >= limit:
                    logger.info(f"Reached limit {limit}")
                    return Comments(comments=collected[:limit])

            if not data.has_more:
                break

            page += 1

        return Comments(comments=collected)


    def get_comments(
        self: 'TiktokComment',
        aweme_id: str,
        size: Optional[int] = 50,
        page: Optional[int] = 1
    ) -> Optional[Comments]:
        self.aweme_id: str = aweme_id
        
        try:
            response: Response = self.__session.get(
                '%s/comment/list/' % self.API_URL,
                params={
                    'aid': 1988,
                    'aweme_id': aweme_id,
                    'count': size,
                    'cursor': (page - 1) * size
                }
            )
            response.raise_for_status() # Kiểm tra lỗi HTTP
            json_response = response.json()

            # Nếu không có comments trả về (ví dụ: video bị xóa, hết comment)
            if 'comments' not in json_response or not json_response['comments']:
                return Comments(comments=[], has_more=False)

            data: Dict[str, Any] = jmespath.search(
                """
                {
                    caption: comments[0].share_info.title,
                    video_url: comments[0].share_info.url,
                    comments: comments,
                    has_more: has_more
                }
                """,
                json_response
            )

            # Xử lý trường hợp jmespath search trả về None
            if data is None or 'comments' not in data:
                 return Comments(comments=[], has_more=False)

            return Comments(
                comments=[
                    self.__parse_comment(
                        comment
                    ) for comment in data.pop('comments')
                ],
                **data,
            )
        except Exception as e:
            logger.error(f"Lỗi khi lấy comment cho {aweme_id} (page {page}): {e}")
            return None # Trả về None nếu có lỗi
    
    def __call__(
        self: 'TiktokComment',
        aweme_id: str,
        limit: Optional[int] = None
    ) -> Comments:
        return self.get_all_comments(
            aweme_id=aweme_id,
            limit=limit
        )


# --- HÀM MAIN ĐÃ ĐƯỢC CẬP NHẬT ---

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--aweme_id", required=True)
    parser.add_argument("--size", type=int, default=50)
    parser.add_argument("--output", required=True)

    args = parser.parse_args()

    scraper = TiktokComment()

    logger.info(f"Start scraping {args.size} comments from {args.aweme_id}")

    comments_data: Comments = scraper(
        aweme_id=args.aweme_id,
        limit=args.size
    )

    rows: List[Tuple[str, str]] = []

    for c in comments_data.comments:
        rows.append((c.username, c.comment))

        # nếu muốn tính cả replies vào size → KHÔNG khuyến nghị cho ML
        # for r in c.replies:
        #     rows.append((r.username, r.comment))

    with open(args.output, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(["author", "comment"])
        writer.writerows(rows)

    logger.info(f"Saved {len(rows)} comments to {args.output}")

# --- CẬP NHẬT ĐOẠN __name__ == '__main__' ---

if __name__ == "__main__":
    main()
