import { app } from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`🌿 Nivara Backend running on port ${config.port}`);
  console.log(`📍 API Base URL: http://localhost:${config.port}/api`);
});

