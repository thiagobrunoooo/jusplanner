import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function resetData() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Truncate tables
        await client.query('TRUNCATE TABLE topic_progress CASCADE');
        await client.query('TRUNCATE TABLE daily_history CASCADE');
        await client.query('TRUNCATE TABLE study_time CASCADE');
        await client.query('TRUNCATE TABLE notes CASCADE');
        await client.query('TRUNCATE TABLE materials CASCADE');
        console.log('Tables truncated.');

        // Reset profiles
        await client.query(`
      UPDATE profiles 
      SET xp = 0, 
          level = 1, 
          streak = 0, 
          last_activity = NULL
    `);
        console.log('Profiles reset.');

    } catch (err) {
        console.error('Error resetting data:', err);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

resetData();
