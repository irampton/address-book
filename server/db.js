import pg from "pg";
import { dbConfig } from "./config.js";

const { Pool } = pg;

export const pool = new Pool( dbConfig );

export async function ensureContactsTable() {
  const contactsQuery = `
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  const settingsQuery = `
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY,
      columns JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await pool.query( contactsQuery );
  await pool.query( settingsQuery );
  await pool.query(
    "INSERT INTO app_settings (id, columns) VALUES (1, '[]'::jsonb) ON CONFLICT (id) DO NOTHING"
  );
}
