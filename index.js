import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/login.html');
});

app.get('/api', (req, res) => {
  res.json({ ok: true, service: 'CUSTOM-COMMANDS' });
});

app.post('/api/auth', async (req, res) => {
  // login logic
});

// ... other routes

export default app;
