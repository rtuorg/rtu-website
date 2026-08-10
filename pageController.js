const winston = require('winston');
const db = require('../config/db'); // Apke database connection module ka path (e.g. mysql2/promise pool)

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

// Helper function to sanitize user input for safe logging (Prevents Log Injection / Forgery)
const sanitizeForLog = (input) => {
    if (typeof input !== 'string') return 'NON_STRING_INPUT';
    return input.replace(/[\n\r]/g, '_').substring(0, 50); // Truncate and clean
};

// ==========================================
// 2. SECURE RESULT CONTROLLER (Live Parameterized DB Lookup)
// ==========================================
const getStudentResult = async (req, res, next) => {
    try {
        const rawRollNo = req.body.roll_no;

        // Strict Type Check & Object Pollution Defense
        if (!rawRollNo || typeof rawRollNo !== 'string' || Array.isArray(rawRollNo)) {
            logger.warn(`[SECURITY WARNING] Invalid input type or empty roll number attempt from IP: ${req.ip}`);
            return res.status(400).render('results', {
                result: null,
                error: 'Valid Roll number is required.',
                rollNo: null,
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Secure Semester Result Portal'
            });
        }

        const rollNo = rawRollNo.trim().toUpperCase();

        // Strict Controller-level RegEx Safeguard (Defense in Depth)
        if (rollNo.length < 5 || rollNo.length > 15 || !/^[A-Z0-9]+$/.test(rollNo)) {
            logger.warn(`[SECURITY ALERT] Malformed roll number pattern blocked. IP: ${req.ip}, Input: ${sanitizeForLog(rollNo)}`);
            return res.status(400).render('results', {
                result: null,
                error: 'Invalid Roll Number format.',
                rollNo: null,
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Secure Semester Result Portal'
            });
        }

        // ==========================================
        // LIVE DATABASE PARAMETERIZED QUERY (SQL Injection Proof)
        // ==========================================
        // 1. Fetch Student Core Details
        const [studentRows] = await db.execute(
            'SELECT roll_no, student_name, enrollment_no, course, semester, total_marks, percentage, status FROM results WHERE roll_no = ?', 
            [rollNo]
        );

        if (!studentRows || studentRows.length === 0) {
            logger.info(`[DATABASE NOTICE] Result not found for RollNo: ${sanitizeForLog(rollNo)} by IP: ${req.ip}`);
            return res.render('results', {
                result: null,
                error: 'No academic record found for the provided Roll Number.',
                rollNo: rollNo,
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Secure Semester Result Portal'
            });
        }

        const student = studentRows[0];

        // 2. Fetch Subject-wise Marks for this Student/Roll Number using Parameterized Query
        const [subjectRows] = await db.execute(
            'SELECT code, name, internal, external, total FROM student_subjects WHERE roll_no = ?',
            [rollNo]
        );

        // Construct final data payload
        const studentResultData = {
            roll_no: student.roll_no,
            student_name: student.student_name,
            enrollment_no: student.enrollment_no,
            course: student.course,
            semester: student.semester,
            total_marks: student.total_marks,
            percentage: student.percentage,
            status: student.status,
            subjects: subjectRows || []
        };

        logger.info(`[SECURE ACCESS SUCCESS] Result successfully fetched from DB for RollNo: ${sanitizeForLog(rollNo)} by IP: ${req.ip}`);
        return res.render('results', {
            result: studentResultData,
            error: null,
            rollNo: rollNo,
            nonce: res.locals.nonce,
            csrfToken: res.locals.csrfToken,
            title: 'RTU Secure Semester Result Portal'
        });

    } catch (err) {
        logger.error(`[CRITICAL DATABASE ERROR] Failed to fetch result - Error: ${err.message}`);
        next(err); 
    }
};

// ==========================================
// 3. SECURE CERTIFICATE VERIFICATION CONTROLLER (Live Parameterized DB Lookup)
// ==========================================
const verifyCertificateRecord = async (req, res, next) => {
    try {
        const rawCertNo = req.body.cert_no;

        // Strict Type Check & Object Pollution Defense
        if (!rawCertNo || typeof rawCertNo !== 'string' || Array.isArray(rawCertNo)) {
            logger.warn(`[SECURITY WARNING] Invalid input type or empty certificate verification attempt from IP: ${req.ip}`);
            return res.status(400).render('certificate', {
                certificate: null,
                error: 'Valid Certificate number is required.',
                certNo: null,
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Certificate Verification Portal'
            });
        }

        const certNo = rawCertNo.trim().toUpperCase();

        // Strict Controller-level RegEx Safeguard for Certificates (Alphanumeric, slashes, dashes)
        if (certNo.length < 5 || certNo.length > 30 || !/^[A-Z0-9\/\-]+$/.test(certNo)) {
            logger.warn(`[SECURITY ALERT] Malformed certificate pattern blocked. IP: ${req.ip}, Input: ${sanitizeForLog(certNo)}`);
            return res.status(400).render('certificate', {
                certificate: null,
                error: 'Invalid Certificate format.',
                certNo: null,
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Certificate Verification Portal'
            });
        }

        // ==========================================
        // LIVE DATABASE PARAMETERIZED QUERY (SQL Injection Proof)
        // ==========================================
        const [certRows] = await db.execute(
            'SELECT cert_no, student_name, course, issue_date, verification_status, qr_code_image FROM certificates WHERE cert_no = ?', 
            [certNo]
        );

        if (!certRows || certRows.length === 0) {
            logger.info(`[DATABASE NOTICE] Certificate not verified for CertNo: ${sanitizeForLog(certNo)} by IP: ${req.ip}`);
            return res.render('certificate', {
                certificate: null,
                error: 'Invalid Certificate Number or record does not exist in RTU database.',
                certNo: certNo,
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Certificate Verification Portal'
            });
        }

        const certificateData = certRows[0];

        logger.info(`[SECURE ACCESS SUCCESS] Certificate verified from DB successfully for CertNo: ${sanitizeForLog(certNo)} by IP: ${req.ip}`);
        return res.render('certificate', {
            certificate: certificateData,
            error: null,
            certNo: certNo,
            nonce: res.locals.nonce,
            csrfToken: res.locals.csrfToken,
            title: 'RTU Certificate Verification Portal'
        });

    } catch (err) {
        logger.error(`[CRITICAL DATABASE ERROR] Failed to verify certificate - Error: ${err.message}`);
        next(err); 
    }
};

module.exports = {
    getStudentResult,
    verifyCertificateRecord
};