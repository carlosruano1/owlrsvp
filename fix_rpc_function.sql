-- Fix the get_user_events RPC function
-- Run this in Supabase SQL Editor to update the function

-- First drop the existing function since we changed the return type
DROP FUNCTION IF EXISTS get_user_events(uuid);

-- Now recreate with the correct return type and fixed ambiguous column references
CREATE FUNCTION get_user_events(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  admin_token VARCHAR(255),
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