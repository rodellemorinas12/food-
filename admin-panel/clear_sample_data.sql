-- SQL Script to Remove Sample Data from Database
-- Run this in MySQL Workbench or command line

USE react_admin_db;

-- Clear dashboard stats
TRUNCATE TABLE dashboard_stats;

-- Clear transactions
TRUNCATE TABLE transactions;

-- Clear other tables if needed
-- TRUNCATE TABLE teams;
-- TRUNCATE TABLE contacts;
-- TRUNCATE TABLE invoices;
-- TRUNCATE TABLE calendar_events;
-- TRUNCATE TABLE chart_data;
-- TRUNCATE TABLE geography_data;

-- Verify data is removed
SELECT 'Dashboard Stats:' as info;
SELECT COUNT(*) as count FROM dashboard_stats;

SELECT 'Transactions:' as info;
SELECT COUNT(*) as count FROM transactions;

SELECT 'Tables cleared successfully!';
