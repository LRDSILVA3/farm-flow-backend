import 'reflect-metadata';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import cors from 'cors';
import routes from './routes';
import AppError from '@shared/errors/AppError';
import '@shared/typeorm';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint for Coolify and uptime monitoring
app.get('/health', (request: Request, response: Response) => {
  return response.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(routes);

app.use(
  (error: Error, request: Request, response: Response, next: NextFunction) => {
    if (error instanceof AppError) {
      return response.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    }
    console.error('Unhandled server error:', error);
    return response.status(500).json({
      status: 'error',
      message: 'internal server error',
    });
  },
);

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`🚀 Server started on port ${port}!`);
});
