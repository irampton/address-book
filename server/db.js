import pg from "pg";
import { dbConfig } from "./config.js";

const { Pool } = pg;

export const pool = new Pool( dbConfig );

export async function ensureContactsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      address JSONB,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await pool.query( query );
  await pool.query( "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address JSONB" );
}
