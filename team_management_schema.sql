-- Team Management Schema for OwlRSVP
-- This file contains the database schema for the team management feature

-- Team Members Table
-- Links admin users (owners) to their team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'admin', 'editor', 'viewer'
  status VARCHAR(50) NOT NULL DEFAULT 'invited', -- 'invited', 'active', 'inactive'
  owner_subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free', -- Store admin's tier at invitation time
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT team_members_valid_role CHECK (role IN ('admin', 'editor', 'viewer')),
  CONSTRAINT team_members_valid_status CHECK (status IN ('invited', 'active', 'inactive')),
  CONSTRAINT team_members_unique_email_per_owner UNIQUE (owner_id, email)
);

-- Event Permissions Table
-- Defines what permissions team members have for specific events
CREATE TABLE event_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{
    "can_edit": true,
    "can_view_analytics": true,
    "can_export_data": true,
    "can_send_communications": false
  }',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID NOT NULL REFERENCES admin_users(id),

  -- Constraints
  CONSTRAINT event_permissions_unique_event_member UNIQUE (event_id, team_member_id)
);

-- Team Invitations Table (for tracking invitation tokens)
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_event_permissions_event_id ON event_permissions(event_id);
CREATE INDEX idx_event_permissions_team_member_id ON event_permissions(team_member_id);
CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_expires ON team_invitations(expires_at);

-- Row Level Security (RLS) Policies

-- Team Members RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Owners can see their own team members
CREATE POLICY team_members_owner_access ON team_members
  FOR ALL USING (owner_id = auth.uid());

-- Team members can see their own records
CREATE POLICY team_members_self_access ON team_members
  FOR SELECT USING (email = (SELECT email FROM admin_users WHERE id = auth.uid()));

-- Event Permissions RLS
ALTER TABLE event_permissions ENABLE ROW LEVEL SECURITY;

-- Owners can manage permissions for their events
CREATE POLICY event_permissions_owner_access ON event_permissions
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e WHERE e.created_by_admin_id = auth.uid()
    ) OR
    team_member_id IN (
      SELECT tm.id FROM team_members tm WHERE tm.owner_id = auth.uid()
    )
  );

-- Team members can view their permissions
CREATE POLICY event_permissions_member_access ON event_permissions
  FOR SELECT USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm WHERE tm.email = (SELECT email FROM admin_users WHERE id = auth.uid())
    )
  );

-- Team Invitations RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Owners can manage invitations for their team
CREATE POLICY team_invitations_owner_access ON team_invitations
  FOR ALL USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm WHERE tm.owner_id = auth.uid()
    )
  );

-- Functions for Team Management

-- Function to invite a team member
CREATE OR REPLACE FUNCTION invite_team_member(
  p_owner_id UUID,
  p_email VARCHAR(255),
  p_role VARCHAR(50) DEFAULT 'editor'
) RETURNS UUID AS $$
DECLARE
  v_team_member_id UUID;
  v_invitation_token VARCHAR(255);
  v_owner_tier VARCHAR(50);
BEGIN
  -- Get owner's current subscription tier
  SELECT subscription_tier INTO v_owner_tier
  FROM admin_users
  WHERE id = p_owner_id;

  -- Check if owner has pro or enterprise subscription
  IF v_owner_tier NOT IN ('pro', 'enterprise') THEN
    RAISE EXCEPTION 'Team management requires a Pro or Enterprise subscription';
  END IF;

  -- Check if email is already a team member for this owner
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE owner_id = p_owner_id AND email = p_email
  ) THEN
    RAISE EXCEPTION 'This email is already a team member';
  END IF;

  -- Check if email is already an admin user
  IF EXISTS (
    SELECT 1 FROM admin_users WHERE email = p_email
  ) THEN
    RAISE EXCEPTION 'This email is already registered as an admin user';
  END IF;

  -- Create team member record
  INSERT INTO team_members (owner_id, email, role, status, owner_subscription_tier)
  VALUES (p_owner_id, p_email, p_role, 'invited', v_owner_tier)
  RETURNING id INTO v_team_member_id;

  -- Generate invitation token
  v_invitation_token := encode(gen_random_bytes(32), 'base64url');

  -- Create invitation record
  INSERT INTO team_invitations (team_member_id, invitation_token, expires_at)
  VALUES (v_team_member_id, v_invitation_token, NOW() + INTERVAL '7 days');

  RETURN v_team_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(
  p_invitation_token VARCHAR(255),
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_team_member_id UUID;
  v_email VARCHAR(255);
BEGIN
  -- Find valid invitation
  SELECT ti.team_member_id, tm.email INTO v_team_member_id, v_email
  FROM team_invitations ti
  JOIN team_members tm ON tm.id = ti.team_member_id
  WHERE ti.invitation_token = p_invitation_token
  AND ti.used = FALSE
  AND ti.expires_at > NOW();

  IF v_team_member_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- Verify the accepting user matches the invited email
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = p_user_id AND email = v_email
  ) THEN
    RAISE EXCEPTION 'Invitation email does not match your account email';
  END IF;

  -- Mark invitation as used
  UPDATE team_invitations
  SET used = TRUE
  WHERE invitation_token = p_invitation_token;

  -- Activate team member
  UPDATE team_members
  SET status = 'active', joined_at = NOW()
  WHERE id = v_team_member_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access an event
CREATE OR REPLACE FUNCTION can_access_event(
  p_user_id UUID,
  p_event_id UUID,
  p_permission_type VARCHAR(50) DEFAULT 'can_edit'
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user owns the event
  IF EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id AND created_by_admin_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user is a team member with required permission
  RETURN EXISTS (
    SELECT 1 FROM team_members tm
    JOIN event_permissions ep ON ep.team_member_id = tm.id
    WHERE tm.email = (SELECT email FROM admin_users WHERE id = p_user_id)
    AND tm.status = 'active'
    AND ep.event_id = p_event_id
    AND (ep.permissions->>p_permission_type)::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant event permissions to team member
CREATE OR REPLACE FUNCTION grant_event_permissions(
  p_owner_id UUID,
  p_event_id UUID,
  p_team_member_email VARCHAR(255),
  p_permissions JSONB DEFAULT '{
    "can_edit": true,
    "can_view_analytics": true,
    "can_export_data": true,
    "can_send_communications": false
  }'
) RETURNS BOOLEAN AS $$
DECLARE
  v_team_member_id UUID;
BEGIN
  -- Verify owner owns the event
  IF NOT EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id AND created_by_admin_id = p_owner_id
  ) THEN
    RAISE EXCEPTION 'You do not own this event';
  END IF;

  -- Find team member
  SELECT id INTO v_team_member_id
  FROM team_members
  WHERE owner_id = p_owner_id AND email = p_team_member_email AND status = 'active';

  IF v_team_member_id IS NULL THEN
    RAISE EXCEPTION 'Team member not found or not active';
  END IF;

  -- Insert or update permissions
  INSERT INTO event_permissions (event_id, team_member_id, permissions, granted_by)
  VALUES (p_event_id, v_team_member_id, p_permissions, p_owner_id)
  ON CONFLICT (event_id, team_member_id)
  DO UPDATE SET
    permissions = EXCLUDED.permissions,
    granted_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible events (including team events)
-- Drop first if exists due to return type change
DROP FUNCTION IF EXISTS get_user_events(uuid);
CREATE FUNCTION get_user_events(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  admin_token TEXT,
  created_by_admin_id UUID,
  archived BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Events owned by user
  SELECT
    e.id, e.title, e.admin_token, e.created_by_admin_id, e.archived, e.created_at,
    '{"can_edit": true, "can_view_analytics": true, "can_export_data": true, "can_send_communications": true}'::jsonb as permissions
  FROM events e
  WHERE e.created_by_admin_id = p_user_id

  UNION ALL

  -- Events accessible via team permissions
  SELECT
    e.id, e.title, e.admin_token, e.created_by_admin_id, e.archived, e.created_at,
    ep.permissions
  FROM events e
  JOIN event_permissions ep ON ep.event_id = e.id
  JOIN team_members tm ON tm.id = ep.team_member_id
  WHERE tm.email = (SELECT au.email FROM admin_users au WHERE au.id = p_user_id)
  AND tm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();