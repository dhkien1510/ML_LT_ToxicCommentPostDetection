import os
import csv
import json
import jmespath
import logging
from requests import Session, Response
from typing import Dict, Any, Optional, Iterator, List, Tuple

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
        aweme_id: str
    ) -> Comments:
        page: int = 1
        data: Comments = self.get_comments( aweme_id=aweme_id, page=page )
        if not data: # Nếu lần gọi đầu tiên thất bại, trả về rỗng
             return Comments(comments=[])
            
        while(True):
            page += 1
            
            comments: Comments = self.get_comments(
                aweme_id=aweme_id,
                page=page
            )
            if(not comments or not comments.has_more): break

            data.comments.extend(
                comments.comments
            )

        return data

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
        aweme_id: str
    ) -> Comments:
        return self.get_all_comments(
            aweme_id=aweme_id
        )

# --- HÀM MAIN ĐÃ ĐƯỢC CẬP NHẬT ---

def main(
    input_file: str,
    output_dir: str
):
    # 1. Đảm bảo thư mục output tồn tại
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        logger.info(f"Đã tạo thư mục: {output_dir}")

    # 2. Đọc file awmeid.txt
    try:
        with open(input_file, 'r') as f:
            # Đọc, xóa khoảng trắng/xuống dòng thừa, và bỏ qua các dòng rỗng
            aweme_ids = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        logger.error(f"KHÔNG TÌM THẤY FILE: {input_file}")
        raise ValueError(f"Vui lòng tạo file {input_file} chứa các ID.")
    
    logger.info(f"Tìm thấy {len(aweme_ids)} ID để xử lý từ {input_file}")

    # 3. Khởi tạo scraper (chỉ 1 lần)
    scraper = TiktokComment()

    # 4. Lặp qua từng ID để xử lý
    for aweme_id in aweme_ids:
        logger.info(f"--- Bắt đầu cào ID: {aweme_id} ---")
        
        try:
            # 5. Gọi scraper
            comments_data: Comments = scraper(aweme_id=aweme_id)
            
            # 6. Chuẩn bị dữ liệu để ghi ra CSV (Làm phẳng comment + replies)
            data_to_write: List[Tuple[str, str]] = []
            
            if not comments_data.comments:
                logger.warning(f"Không tìm thấy comment nào cho ID: {aweme_id}")
                continue # Bỏ qua ID này và tiếp tục

            for main_comment in comments_data.comments:
                # Thêm comment chính
                data_to_write.append(
                    (main_comment.username, main_comment.comment)
                )
                
                # Thêm các replies của comment đó
                if main_comment.replies:
                    for reply in main_comment.replies:
                        data_to_write.append(
                            (reply.username, reply.comment)
                        )
            
            logger.info(f"Tìm thấy tổng cộng {len(data_to_write)} comments (bao gồm replies) cho ID: {aweme_id}")

            # 7. Ghi ra file CSV
            final_path = os.path.join(output_dir, f"{aweme_id}.csv")
            
            with open(final_path, 'w', encoding='utf-8', newline='') as csvfile:
                # Sử dụng csv.QUOTE_ALL để bọc tất cả các trường trong ""
                writer = csv.writer(csvfile, quoting=csv.QUOTE_ALL)
                
                # Ghi tiêu đề
                writer.writerow(["author", "comment"])
                
                # Ghi toàn bộ dữ liệu
                writer.writerows(data_to_write)
            
            logger.info(f"Đã lưu thành công file: {final_path}")

        except Exception as e:
            logger.error(f"Gặp lỗi khi xử lý ID {aweme_id}: {e}", exc_info=True)
            # Tiếp tục xử lý ID tiếp theo dù gặp lỗi
            pass

# --- CẬP NHẬT ĐOẠN __name__ == '__main__' ---

if(__name__ == '__main__'):
    # Định nghĩa file input và thư mục output
    INPUT_FILE = 'awmeid.txt'
    OUTPUT_DIR = 'tiktok_comments_csv' # Tên thư mục chứa các file CSV
    
    main(input_file=INPUT_FILE, output_dir=OUTPUT_DIR)