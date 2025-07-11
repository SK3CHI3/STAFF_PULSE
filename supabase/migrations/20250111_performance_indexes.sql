-- Performance Indexes for STAFF_PULSE Database
-- Created: 2025-01-11
-- Purpose: Optimize common queries for employee wellness platform

-- ============================================================================
-- MOOD_CHECKINS TABLE INDEXES
-- ============================================================================

-- Composite index for organization + employee + date queries (most common)
-- Optimizes: Employee mood history, individual employee analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_checkins_org_employee_date 
ON mood_checkins (organization_id, employee_id, created_at DESC);

-- Index for sentiment analysis queries
-- Optimizes: Sentiment-based analytics, negative mood detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_checkins_sentiment_score 
ON mood_checkins (organization_id, sentiment_score) 
WHERE sentiment_score IS NOT NULL;

-- Index for mood score analytics with date ordering
-- Optimizes: Mood trend analysis, dashboard charts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_checkins_mood_score_date 
ON mood_checkins (organization_id, mood_score, created_at DESC) 
WHERE mood_score IS NOT NULL;

-- Index for anonymous responses analysis
-- Optimizes: Anonymous vs identified response analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_checkins_anonymous 
ON mood_checkins (organization_id, is_anonymous, created_at DESC);

-- ============================================================================
-- EMPLOYEES TABLE INDEXES
-- ============================================================================

-- Index for active employees by department
-- Optimizes: Department-based employee lists, active employee counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_active_department 
ON employees (organization_id, department, is_active) 
WHERE is_active = true;

-- Index for manager-employee relationships
-- Optimizes: Manager dashboard, team hierarchy queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_manager_id 
ON employees (manager_id) 
WHERE manager_id IS NOT NULL;

-- Index for employee email lookups (for WhatsApp integration)
-- Optimizes: Employee lookup by email during message processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_email 
ON employees (email) 
WHERE email IS NOT NULL;

-- ============================================================================
-- AI_INSIGHTS TABLE INDEXES
-- ============================================================================

-- Index for AI insights by severity and date
-- Optimizes: Critical insights dashboard, severity-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insights_severity_date 
ON ai_insights (organization_id, severity, created_at DESC) 
WHERE severity IS NOT NULL;

-- Index for department-specific insights
-- Optimizes: Department manager dashboards, team-specific insights
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insights_department_date 
ON ai_insights (organization_id, department, created_at DESC) 
WHERE department IS NOT NULL;

-- Index for employee-specific insights
-- Optimizes: Individual employee insight history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insights_employee_date 
ON ai_insights (employee_id, created_at DESC) 
WHERE employee_id IS NOT NULL;

-- ============================================================================
-- ALERTS TABLE INDEXES
-- ============================================================================

-- Index for unresolved alerts by type
-- Optimizes: Active alerts dashboard, alert management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_unresolved 
ON alerts (organization_id, alert_type, created_at DESC) 
WHERE is_resolved = false;

-- Index for employee-specific unresolved alerts
-- Optimizes: Employee-specific alert management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_employee_unresolved 
ON alerts (employee_id, is_resolved, created_at DESC) 
WHERE employee_id IS NOT NULL;

-- Index for alert severity filtering
-- Optimizes: High-priority alert dashboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_severity_date 
ON alerts (organization_id, severity, created_at DESC) 
WHERE severity IS NOT NULL;

-- ============================================================================
-- SCHEDULED_CHECKINS TABLE INDEXES
-- ============================================================================

-- Index for organization + status + date queries
-- Optimizes: Scheduled check-in management, status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduled_checkins_org_status 
ON scheduled_checkins (organization_id, status, scheduled_at);

-- Index for department-specific scheduled check-ins
-- Optimizes: Department-based scheduling, targeted check-ins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduled_checkins_department_date 
ON scheduled_checkins (organization_id, department, scheduled_at) 
WHERE department IS NOT NULL;

-- ============================================================================
-- ANALYTICS_DAILY TABLE INDEXES
-- ============================================================================

-- Index for date range analytics queries
-- Optimizes: Dashboard date range filtering, trend analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_daily_date_range 
ON analytics_daily (organization_id, date DESC, average_mood);

-- ============================================================================
-- WHATSAPP_LOGS TABLE INDEXES
-- ============================================================================

-- Index for message status tracking
-- Optimizes: Message delivery monitoring, failed message analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_logs_status_date 
ON whatsapp_logs (organization_id, status, created_at DESC) 
WHERE status IS NOT NULL;

-- Index for employee message history
-- Optimizes: Employee communication history, message threading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_logs_employee_direction 
ON whatsapp_logs (employee_id, direction, created_at DESC) 
WHERE employee_id IS NOT NULL;

-- ============================================================================
-- TEAMS TABLE INDEXES
-- ============================================================================

-- Index for active teams by department
-- Optimizes: Team management, department-based team queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_department_active 
ON teams (organization_id, department, is_active) 
WHERE is_active = true;

-- Index for team lead queries
-- Optimizes: Team leadership dashboards, manager views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_lead 
ON teams (team_lead_id) 
WHERE team_lead_id IS NOT NULL;

-- ============================================================================
-- JSONB INDEXES FOR ADVANCED QUERIES
-- ============================================================================

-- GIN index for AI insights data_points JSONB column
-- Optimizes: Complex data point queries, JSON-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insights_data_points_gin 
ON ai_insights USING GIN (data_points);

-- GIN index for mood_checkins keywords JSONB column
-- Optimizes: Keyword-based mood analysis, text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_checkins_keywords_gin 
ON mood_checkins USING GIN (keywords);

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Index for recent mood check-ins (last 30 days)
-- Optimizes: Recent activity dashboards, current mood trends
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_checkins_recent 
ON mood_checkins (organization_id, created_at DESC) 
WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days');

-- Index for high-priority unread AI insights
-- Optimizes: Critical notification systems, urgent insights
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insights_critical_unread 
ON ai_insights (organization_id, created_at DESC) 
WHERE is_read = false AND severity IN ('high', 'critical');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. All indexes use CONCURRENTLY to avoid blocking operations
-- 2. Partial indexes (WHERE clauses) reduce index size and improve performance
-- 3. DESC ordering on dates optimizes recent-first queries
-- 4. GIN indexes on JSONB columns enable fast JSON queries
-- 5. Composite indexes are ordered by selectivity (most selective first)
--
-- To monitor index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;
--
-- To check index sizes:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
-- FROM pg_stat_user_indexes 
-- ORDER BY pg_relation_size(indexrelid) DESC;
