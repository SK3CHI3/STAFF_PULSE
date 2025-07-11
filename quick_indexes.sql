-- QUICK PERFORMANCE INDEXES FOR STAFF_PULSE
-- Run these first for immediate performance gains
-- Fixed: Removed CONCURRENTLY to avoid transaction block errors

-- 1. Most Critical: Mood check-ins by organization + employee + date
CREATE INDEX IF NOT EXISTS idx_mood_checkins_org_employee_date
ON mood_checkins (organization_id, employee_id, created_at DESC);

-- 2. Sentiment analysis queries
CREATE INDEX IF NOT EXISTS idx_mood_checkins_sentiment_score
ON mood_checkins (organization_id, sentiment_score)
WHERE sentiment_score IS NOT NULL;

-- 3. Active employees by department
CREATE INDEX IF NOT EXISTS idx_employees_active_department
ON employees (organization_id, department, is_active)
WHERE is_active = true;

-- 4. Unresolved alerts
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved
ON alerts (organization_id, alert_type, created_at DESC)
WHERE is_resolved = false;

-- 5. AI insights by severity
CREATE INDEX IF NOT EXISTS idx_ai_insights_severity_date
ON ai_insights (organization_id, severity, created_at DESC)
WHERE severity IS NOT NULL;

-- 6. Recent mood check-ins (last 30 days)
CREATE INDEX IF NOT EXISTS idx_mood_checkins_recent
ON mood_checkins (organization_id, created_at DESC)
WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days');
