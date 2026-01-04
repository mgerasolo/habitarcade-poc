import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  const client = await pool.connect();
  try {
    // Check if column exists
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'habits' 
      AND column_name = 'gray_missed_when_on_track'
    `);
    console.log('Column exists:', result.rows.length > 0);
    
    // Try to select habits
    const habits = await client.query('SELECT id, name, gray_missed_when_on_track FROM habits LIMIT 3');
    console.log('Habits:', habits.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
