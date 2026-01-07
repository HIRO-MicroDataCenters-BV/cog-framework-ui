import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { MongoClient } from 'mongodb';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { db_url, table_name } = body;

  if (!db_url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Database URL is required',
    });
  }

  // Detect database type from URL protocol
  const dbType = db_url.split(':')[0].toLowerCase();

  try {
    let tables: string[] = [];
    let tableExists = false;

    switch (dbType) {
      case 'postgresql':
      case 'postgres':
        ({ tables, tableExists } = await testPostgreSQL(db_url, table_name));
        break;

      case 'mysql':
        ({ tables, tableExists } = await testMySQL(db_url, table_name));
        break;

      case 'sqlite':
        ({ tables, tableExists } = await testSQLite(db_url, table_name));
        break;

      case 'mongodb':
        ({ tables, tableExists } = await testMongoDB(db_url, table_name));
        break;

      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }

    return {
      success: true,
      data: {
        tables,
        tableExists,
        tableName: table_name,
        dbType,
      },
    };
  } catch (error: unknown) {
    const err = error as Error & { code?: string; host?: string; port?: number };
    console.error('Database connection error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
    return {
      success: false,
      error: err.message || 'Failed to connect to database',
      code: err.code,
      details: {
        host: err.host,
        port: err.port,
      },
    };
  }
});

async function testPostgreSQL(db_url: string, table_name?: string) {
  const client = new PgClient({ connectionString: db_url });
  try {
    await client.connect();
    const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
    const tables = result.rows.map((row) => row.table_name);
    const tableExists = table_name ? tables.includes(table_name) : false;
    return { tables, tableExists };
  } finally {
    await client.end();
  }
}

async function testMySQL(db_url: string, table_name?: string) {
  const connection = await mysql.createConnection(db_url);
  try {
    const [rows] = await connection.query('SHOW TABLES');
    const tables = (rows as Record<string, string>[]).map(
      (row) => Object.values(row)[0] as string,
    );
    const tableExists = table_name ? tables.includes(table_name) : false;
    return { tables, tableExists };
  } finally {
    await connection.end();
  }
}

async function testSQLite(db_url: string, table_name?: string) {
  // Extract file path from sqlite:///path/to/file.db
  const filePath = db_url.replace(/^sqlite:\/\/\//, '');
  const db = new Database(filePath, { readonly: true });
  try {
    const rows = db
      .prepare(
        `
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            ORDER BY name;
        `,
      )
      .all() as { name: string }[];
    const tables = rows.map((row) => row.name);
    const tableExists = table_name ? tables.includes(table_name) : false;
    return { tables, tableExists };
  } finally {
    db.close();
  }
}

async function testMongoDB(db_url: string, table_name?: string) {
  const client = new MongoClient(db_url);
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    const tables = collections.map((col) => col.name);
    const tableExists = table_name ? tables.includes(table_name) : false;
    return { tables, tableExists };
  } finally {
    await client.close();
  }
}
