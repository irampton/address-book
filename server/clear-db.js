import pg from "pg";
import { dbConfig } from "./config.js";

const { Pool } = pg;
const pool = new Pool( dbConfig );

async function clearDatabase() {
  const truncateQuery = `
    DO $$
    DECLARE
      record_item RECORD;
    BEGIN
      FOR record_item IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      ) LOOP
        EXECUTE 'TRUNCATE TABLE '
          || quote_ident( record_item.tablename )
          || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `;

  await pool.query( truncateQuery );
}

try {
  await clearDatabase();
  console.log( "Database cleared." );
} catch ( error ) {
  console.error( "Failed to clear database", error );
  process.exitCode = 1;
} finally {
  await pool.end();
}
