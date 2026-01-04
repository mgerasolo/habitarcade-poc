import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const client = await pool.connect();
  try {
    // Add target_percentage if not exists
    await client.query(`
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_percentage integer DEFAULT 90
    `);
    console.log('Added target_percentage');
    
    // Add warning_percentage if not exists
    await client.query(`
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS warning_percentage integer DEFAULT 75
    `);
    console.log('Added warning_percentage');
    
    console.log('Done!');
  } finally {
    client.release();
    await pool.end();
  }
}
fix();
