import axios from "axios";

const THREAD_API = "http://localhost:8000/thread_comments";

export const scrapeThreadsComments = async (url) => {
    const response = await axios.get(THREAD_API, {
        params: { url, limit: 500 }
    });

    return response.data.comments;
};
