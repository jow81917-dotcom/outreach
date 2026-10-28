-- ============================================================
-- OutreachTrack — Video Editing CRM Schema
-- Run this in Neon SQL Editor (console.neon.tech)
-- ============================================================

-- ─── PROSPECTS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prospects (
  id                 SERIAL PRIMARY KEY,
  name               TEXT        NOT NULL,
  business_name      TEXT,
  niche              TEXT,
  contact_method     TEXT,
  contact_handle     TEXT,
  profile_url        TEXT,
  status             TEXT        NOT NULL DEFAULT 'not_contacted'
                       CHECK (status IN ('not_contacted','contacted','replied','interested','not_interested','client')),
  date_added         DATE        NOT NULL DEFAULT CURRENT_DATE,
  first_contacted_at DATE,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_status     ON prospects (status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_name       ON prospects USING gin (to_tsvector('english', name));

-- ─── OUTREACH ACTIVITIES ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outreach_activities (
  id             SERIAL PRIMARY KEY,
  prospect_id    INTEGER     NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  activity_type  TEXT        NOT NULL
                   CHECK (activity_type IN ('message_sent','reply_received','call','meeting','note')),
  content        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_prospect_id ON outreach_activities (prospect_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at  ON outreach_activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type        ON outreach_activities (activity_type);

-- ─── FOLLOW-UPS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS follow_ups (
  id             SERIAL PRIMARY KEY,
  prospect_id    INTEGER     NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  due_at         TIMESTAMPTZ NOT NULL,
  note           TEXT,
  completed      BOOLEAN     NOT NULL DEFAULT false,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_prospect_id ON follow_ups (prospect_id);
CREATE INDEX IF NOT EXISTS idx_followups_due_at      ON follow_ups (due_at);
CREATE INDEX IF NOT EXISTS idx_followups_completed   ON follow_ups (completed);

-- ─── AUTO-UPDATE updated_at TRIGGER ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prospects_updated_at ON prospects;
CREATE TRIGGER trg_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
