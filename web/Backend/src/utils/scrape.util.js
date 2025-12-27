import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

export async function scrapeCommentsFromUrl(postUrl, cursor = null) {
  const API_KEY = process.env.API_KEY;

  try {
    const apiUrl = "https://api.scrapecreators.com/v1/facebook/post/comments";

    const response = await axios.get(apiUrl, {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      },
      params: {
        url: postUrl,
        cursor: cursor
      }
    });

    // console.log("Response:", response.data);
    
    const result = [];

    for (const comment of response.data.comments) {
      result.push(comment.text);
    }

    return result;

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

