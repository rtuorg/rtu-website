const mysql = require('mysql2/promise');
const winston = require('winston');

// ==========================================
// 1. SAFE LOGGER REFERENCE (Centralized Audit Trail)
// ==========================================
const logger = winston.loggers.has('default') 
    ? winston.loggers.get('default') 
    : winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({ filename: 'security_audit.log' }),
            new winston.transports.Console({ format: winston.format.simple() }),
        ],
    });

// ==========================================
// 2. PRODUCTION FAIL-SAFE VALIDATION
// ==========================================
if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
    logger.error(`[CRITICAL SECURITY ERROR] Database password is missing in production environment configuration.`);
    throw new Error('FATAL: Database password must be defined in production mode.');
}

// ==========================================
// 3. SECURE CONNECTION POOL CONFIGURATION
// ==========================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'rtu_secure_prod_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'rtu_portal_secure_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    
    // Performance & Security Resource Constraints
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT, 10) : 50,
    queueLimit: 0,
    
    // Hardening Flags
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    namedPlaceholders: true, // Prevents query mismatch and enhances parameterized security
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

// ==========================================
// 4. POOL ERROR LISTENER (Anti-Crash Safeguard)
// ==========================================
pool.on('error', (err) => {
    logger.error(`[DATABASE POOL ERROR] Unexpected database error on idle connection: ${err.message}`);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.error(`[DATABASE ERROR] Database connection was closed.`);
    }
});

// ==========================================
// 5. POOL HEALTH CHECK & CONNECTION VERIFICATION
// ==========================================
(async () => {
    try {
        const connection = await pool.getConnection();
        logger.info(`[DATABASE SUCCESS] Secure MySQL connection pool successfully established. Host: ${process.env.DB_HOST || 'localhost'}, Pool Limit: 50`);
        connection.release(); // Release back to pool immediately
    } catch (err) {
        logger.error(`[DATABASE CRITICAL ERROR] Failed to connect to secure database pool: ${err.message}`);
        console.error(`❌ DATABASE CONNECTION FAILED: ${err.message}`);
    }
})();

// ==========================================
// 6. EXPORT SECURED POOL
// ==========================================
module.exports = pool;