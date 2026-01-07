import { Client } from 'pg';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { db_url, table_name } = body;

    if (!db_url) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Database URL is required',
        });
    }

    let client: Client | null = null;

    try {
        // Create PostgreSQL client
        client = new Client({
            connectionString: db_url,
        });

        // Connect to database
        await client.connect();

        // Get list of tables
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        const tables = tablesResult.rows.map((row) => row.table_name);

        // Check if specific table exists
        let tableExists = false;
        if (table_name) {
            tableExists = tables.includes(table_name);
        }

        return {
            success: true,
            data: {
                tables,
                tableExists,
                tableName: table_name,
            },
        };
    } catch (error: any) {
        console.error('Database connection error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
        return {
            success: false,
            error: error.message || 'Failed to connect to database',
            code: error.code,
            details: {
                host: error.host,
                port: error.port,
            },
        };
    } finally {
        // Always close the connection
        if (client) {
            try {
                await client.end();
            } catch (e) {
                console.error('Error closing database connection:', e);
            }
        }
    }
});
