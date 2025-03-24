import express from 'express';
import { config } from 'dotenv';
import { customResponse } from './utils/response.js';
import cors from 'cors';
import connectDB  from './config/db.js'
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';


// Load environment variables
config();


// Initialize express app
const app = express();


const allowedOrigins = ['http://localhost:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log(`Checking origin: ${origin}`);
      if (!origin || allowedOrigins.includes(origin)|| allowedOrigins.includes(("*"))) {
        console.log(`Origin ${origin} is allowed`);
        callback(null, true);
      } else {
        console.log(`Origin ${origin} is not allowed`);
        callback(new Error('Not allowed by CORS'));
      }
    },

    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.options('*', cors()); // Handle preflight requests

// app.use(json()); // For parsing JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());



connectDB(); // Connect to the database

// Use routes
app.use('/api', authRoutes);  // Authentication (register, login)

app.use('/api/upload', (req, res, next) => {
  const filePath = path.join(process.cwd(), 'upload', req.path);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  next();
}, express.static(path.join(process.cwd(), 'upload')));


// Catch-all for undefined routes
app.use((req, res) => {
  customResponse(res, 'Route not found', 404);
});

// Start the server
const PORT = process.env.PORT || 5000;

try {
  // Listen on a specific IP address (0.0.0.0 listens on all interfaces)
  app.listen(PORT, '0.0.0.0', () => { // Use your local machine's IP address here
    console.log(`Server running on http://192.168.1.21:${PORT}`);
  });
} 
catch (err) {
    console.error("Error starting server:", err.message);
}
