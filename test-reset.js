const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  const res = await fetch('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'SquadFallAdmin', password: 'newpassword' }),
  });

  console.log('Reset response status:', res.status);
  const data = await res.json();
  console.log('Reset response:', data);

  // Check database after reset
  const { createClient } = require('@libsql/client');
  const { scryptSync } = require('crypto');
  const path = require('path');

  const url = `file:${path.join(process.cwd(), 'squadfall.db')}`;
  const db = createClient({ url });

  const result = await db.execute({
    sql: 'SELECT password_hash FROM users WHERE username = ?',
    args: ['SquadFallAdmin'],
  });

  console.log('Hash after reset:', result.rows[0].password_hash);
})();
