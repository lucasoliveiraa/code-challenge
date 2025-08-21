import { run } from './app.js';

run().catch(err => {
  console.error(err?.message ?? String(err));
  process.exit(1);
});
