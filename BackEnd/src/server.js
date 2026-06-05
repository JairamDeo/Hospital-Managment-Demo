import { config } from 'dotenv';
import connectDB from './config/db.js';

config();

const start = async () => {
  await connectDB();
  const { default: app } = await import('./app.js');
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    import('./jobs/smsReminder.job.js').then(({ startSmsReminderJob }) => startSmsReminderJob());
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env`);
    } else {
      console.error('Error starting server:', err.message);
    }
    process.exit(1);
  });
};

start();
