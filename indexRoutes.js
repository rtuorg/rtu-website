const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const pageController = require('./pageController');

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

// Helper function to sanitize user inputs for safe logging (Prevents Log Injection / Forgery)
const sanitizeForLog = (input) => {
    if (typeof input !== 'string') return 'NON_STRING_INPUT';
    return input.replace(/[\n\r]/g, '_').substring(0, 50);
};

// ==========================================
// 2. GET ROUTES (Render Views with Nonce & CSRF)
// ==========================================

router.get('/', (req, res, next) => {
    try {
        res.render('index', { 
            nonce: res.locals.nonce,
            csrfToken: res.locals.csrfToken,
            title: 'Rajasthan Technical University | Kota Rajasthan'
        });
    } catch (err) {
        logger.error(`[ROUTE ERROR] Home GET failed: ${err.message}`);
        next(err);
    }
});

router.get('/results', (req, res, next) => {
    try {
        res.render('results', { 
            result: null, 
            error: null, 
            rollNo: null,
            nonce: res.locals.nonce,
            csrfToken: res.locals.csrfToken,
            title: 'RTU Secure Semester Result Portal'
        });
    } catch (err) {
        logger.error(`[ROUTE ERROR] Results GET failed: ${err.message}`);
        next(err);
    }
});

router.get('/verify-certificate', (req, res, next) => {
    try {
        res.render('certificate', { 
            certificate: null, 
            error: null, 
            certNo: null,
            nonce: res.locals.nonce,
            csrfToken: res.locals.csrfToken,
            title: 'RTU Certificate Verification Portal'
        });
    } catch (err) {
        logger.error(`[ROUTE ERROR] Certificate GET failed: ${err.message}`);
        next(err);
    }
});

// ==========================================
// 3. POST ROUTES (Strict Validation, Anti-Crash & Controller Hook)
// ==========================================

// Results POST Route with express-validator and PageController delegation
router.post('/results', [
    body('roll_no')
        .trim()
        .notEmpty().withMessage('Roll number cannot be empty.')
        .isString().withMessage('Invalid input type.')
        .isLength({ min: 5, max: 15 }).withMessage('Invalid Roll Number Length.')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Invalid Format. Only alphanumeric characters allowed.')
], (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`[SECURITY ALERT] Invalid Result Request blocked. IP: ${req.ip}, Input: ${sanitizeForLog(req.body.roll_no)}`);
            return res.status(400).render('results', { 
                result: null, 
                error: 'Invalid Roll Number format or length.', 
                rollNo: null, 
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Secure Semester Result Portal'
            });
        }
        // Delegate execution securely to pageController logic
        return pageController.getStudentResult(req, res, next);
    } catch (err) {
        logger.error(`[CRITICAL ROUTE ERROR] Results POST execution failed: ${err.message}`);
        next(err);
    }
});

// Certificate Verification POST Route with validation and PageController delegation
router.post('/verify-certificate', [
    body('cert_no')
        .trim()
        .notEmpty().withMessage('Certificate number cannot be empty.')
        .isString().withMessage('Invalid input type.')
        .isLength({ min: 5, max: 30 }).withMessage('Invalid Certificate Number Length.')
        .matches(/^[a-zA-Z0-9\/\-]+$/).withMessage('Invalid Format. Only alphanumeric, slashes, and dashes allowed.')
], (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn(`[SECURITY ALERT] Invalid Certificate Request blocked. IP: ${req.ip}, Input: ${sanitizeForLog(req.body.cert_no)}`);
            return res.status(400).render('certificate', { 
                certificate: null, 
                error: 'Invalid Certificate format or length.', 
                certNo: null, 
                nonce: res.locals.nonce,
                csrfToken: res.locals.csrfToken,
                title: 'RTU Certificate Verification Portal'
            });
        }
        // Delegate execution securely to pageController logic
        return pageController.verifyCertificateRecord(req, res, next);
    } catch (err) {
        logger.error(`[CRITICAL ROUTE ERROR] Certificate POST execution failed: ${err.message}`);
        next(err);
    }
});

module.exports = router;