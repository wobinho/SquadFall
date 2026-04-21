const { createClient } = require('@libsql/client');
const { scryptSync, randomBytes } = require('crypto');
const path = require('path');

const url = `file:${path.join(process.cwd(), 'squadfall.db')}`;
const db = createClient({ url });

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

(async () => {
  const newHash = hashPassword('admin');
  console.log('New hash for "admin":', newHash);

  const result = await db.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE username = ?',
    args: [newHash, 'SquadFallAdmin'],
  });

  console.log('Update result:', result);

  // Verify
  const verify = await db.execute({
    sql: 'SELECT password_hash FROM users WHERE username = ?',
    args: ['SquadFallAdmin'],
  });

  console.log('Stored hash:', verify.rows[0].password_hash);
})();
