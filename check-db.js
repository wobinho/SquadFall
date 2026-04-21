const { createClient } = require('@libsql/client');
const { scryptSync } = require('crypto');
const path = require('path');

const url = `file:${path.join(process.cwd(), 'squadfall.db')}`;
const db = createClient({ url });

(async () => {
  const result = await db.execute({
    sql: 'SELECT username, password_hash FROM users WHERE username = ?',
    args: ['SquadFallAdmin'],
  });
  console.log('User in database:', result.rows[0]);

  const storedHash = result.rows[0].password_hash;
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    console.log('Salt length:', salt.length);
    console.log('Hash length:', hash.length);
    console.log('Full hash:', storedHash);

    // Try to verify 'admin'
    const computedHash = scryptSync('admin', salt, 32).toString('hex');
    console.log('Computed hash for "admin":', computedHash);
    console.log('Match:', computedHash === hash);
  }
})();
