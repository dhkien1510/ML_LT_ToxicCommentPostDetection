import axios from "axios";

const TIKTOK_API = "http://localhost:8000/tiktok_comments";


export const scrapeTikTokComments = async (url) => {
  const response = await axios.get(TIKTOK_API, {
    params: {
      url,
      limit: 500
    }
  });

  // thống nhất interface: trả về array string
  return response.data.comments;
};
