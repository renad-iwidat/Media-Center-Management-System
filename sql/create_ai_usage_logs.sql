-- AI Usage Logs Table
-- جدول تتبع استخدام AI Hub

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id SERIAL PRIMARY KEY,
  
  -- User Information
  user_identifier VARCHAR(255) NOT NULL,  -- IP address or user ID
  user_agent TEXT,                        -- Browser/client info
  
  -- Request Information
  feature VARCHAR(50) NOT NULL,           -- 'chat', 'tts', 'stt', 'ideas', 'audio_extraction', 'text_tools'
  action VARCHAR(100) NOT NULL,           -- 'generate', 'transcribe', 'synthesize', etc.
  endpoint VARCHAR(255) NOT NULL,         -- Full API endpoint path
  
  -- Request Details
  request_data JSONB,                     -- Input parameters (prompt, text, etc.)
  response_status VARCHAR(20) NOT NULL,   -- 'success', 'error', 'rate_limited'
  response_data JSONB,                    -- Response details or error message
  
  -- Performance Metrics
  duration_ms INTEGER,                    -- Request duration in milliseconds
  tokens_used INTEGER,                    -- AI tokens consumed (if applicable)
  audio_duration_sec DECIMAL(10,2),      -- Audio length for TTS/STT
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_identifier ON ai_usage_logs(user_identifier);
CREATE INDEX IF NOT EXISTS idx_feature ON ai_usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_created_at ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_feature ON ai_usage_logs(user_identifier, feature);
CREATE INDEX IF NOT EXISTS idx_response_status ON ai_usage_logs(response_status);

-- Comments for documentation
COMMENT ON TABLE ai_usage_logs IS 'تتبع استخدام جميع ميزات AI Hub';
COMMENT ON COLUMN ai_usage_logs.user_identifier IS 'معرف المستخدم (IP أو User ID)';
COMMENT ON COLUMN ai_usage_logs.feature IS 'الميزة المستخدمة: chat, tts, stt, ideas, etc.';
COMMENT ON COLUMN ai_usage_logs.action IS 'الإجراء المحدد: generate, transcribe, etc.';
COMMENT ON COLUMN ai_usage_logs.response_status IS 'حالة الطلب: success, error, rate_limited';
COMMENT ON COLUMN ai_usage_logs.duration_ms IS 'مدة تنفيذ الطلب بالميلي ثانية';
COMMENT ON COLUMN ai_usage_logs.tokens_used IS 'عدد الـ tokens المستهلكة من AI';

-- Create view for daily statistics
CREATE OR REPLACE VIEW ai_usage_daily_stats AS
SELECT 
  DATE(created_at) as date,
  feature,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_identifier) as unique_users,
  COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_requests,
  COUNT(CASE WHEN response_status = 'error' THEN 1 END) as failed_requests,
  COUNT(CASE WHEN response_status = 'rate_limited' THEN 1 END) as rate_limited_requests,
  AVG(duration_ms) as avg_duration_ms,
  SUM(tokens_used) as total_tokens_used
FROM ai_usage_logs
GROUP BY DATE(created_at), feature
ORDER BY date DESC, feature;

-- Create view for user statistics
CREATE OR REPLACE VIEW ai_usage_user_stats AS
SELECT 
  user_identifier,
  feature,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_requests,
  SUM(tokens_used) as total_tokens_used,
  AVG(duration_ms) as avg_duration_ms,
  MIN(created_at) as first_used,
  MAX(created_at) as last_used
FROM ai_usage_logs
GROUP BY user_identifier, feature
ORDER BY total_requests DESC;

COMMENT ON VIEW ai_usage_daily_stats IS 'إحصائيات يومية لاستخدام AI Hub';
COMMENT ON VIEW ai_usage_user_stats IS 'إحصائيات استخدام كل مستخدم';
