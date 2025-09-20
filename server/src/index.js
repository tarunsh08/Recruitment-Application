import express from 'express';
import connectDB from './config/database.js';
import { connectRedis } from './config/redis.js';
import router from './routes/users.js';
import errorHandler from './middlewares/errorHandler.js';
import config from './config/environment.js';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', router);

// Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  await connectDB();
  await connectRedis();
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
};

startServer();
