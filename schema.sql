-- ==========================================================
-- RTU HIGH-SECURITY PORTAL - DATABASE SCHEMA (schema.sql)
-- ==========================================================

-- 1. Create Database with Secure Character Set
CREATE DATABASE IF NOT EXISTS rtu_portal_secure_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Select the database
USE rtu_portal_secure_db;

-- ==========================================================
-- 2. STUDENTS CORE RESULT TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS results (
    roll_no VARCHAR(15) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    enrollment_no VARCHAR(30) NOT NULL,
    course VARCHAR(100) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    total_marks VARCHAR(20) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    status VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (roll_no),
    INDEX idx_roll_no (roll_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 3. STUDENT SUBJECTS & MARKS TABLE (Relational Mapping)
-- ==========================================================
CREATE TABLE IF NOT EXISTS student_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(15) NOT NULL,
    code VARCHAR(15) NOT NULL,
    name VARCHAR(150) NOT NULL,
    internal INT NOT NULL,
    external INT NOT NULL,
    total INT NOT NULL,
    FOREIGN KEY (roll_no) REFERENCES results(roll_no) ON DELETE CASCADE,
    INDEX idx_subject_roll (roll_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 4. CERTIFICATES VERIFICATION TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS certificates (
    cert_no VARCHAR(30) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    issue_date VARCHAR(50) NOT NULL,
    verification_status VARCHAR(50) NOT NULL,
    qr_code_image TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cert_no),
    INDEX idx_cert_no (cert_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;