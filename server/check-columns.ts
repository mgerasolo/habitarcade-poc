import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'habits'
      ORDER BY ordinal_position
    `);
    console.log('Habit columns:', result.rows.map(r => r.column_name));
  } finally {
    client.release();
    await pool.end();
  }
}
check();
