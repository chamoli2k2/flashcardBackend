import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Importing the flashcardRoutes from the routes folder
import flashcardRoutes from './routes/flashcardRoutes.js';
app.use('/api/auth/flashcard/v1', flashcardRoutes);

// Importing the user routes from the routes folder
import userRoutes from './routes/userRoutes.js';
app.use('/api/auth/user/v1', userRoutes);

export default app;