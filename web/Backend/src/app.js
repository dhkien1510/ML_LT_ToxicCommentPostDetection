import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiKeyMiddleware from "./middleware/auth.js"
import accountRouter from "./routes/account.route.js"

dotenv.config();

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/account', apiKeyMiddleware, accountRouter);

app.listen(PORT, function () {
    console.log(`Server is running on http://localhost:${PORT}`);
});