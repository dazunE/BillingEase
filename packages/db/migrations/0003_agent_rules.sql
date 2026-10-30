-- Rules for agent data the database enforces, whatever the application does.

-- 1. A proposal's content is fixed once it is made: an agent can't change what a person is
--    looking at. The payload changes only as it is applied with a person's edits, which are
--    recorded in `edits`. An applied, rejected or expired proposal is final. Deleting only
--    happens with its business (be.purge).
CREATE OR REPLACE FUNCTION be_proposal_rules() RETURNS trigger AS $$
BEGIN
  IF current_setting('be.purge', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Proposals are kept; reject one instead of deleting it';
  END IF;
  IF NEW.business_id <> OLD.business_id OR NEW.kind <> OLD.kind OR NEW.agent <> OLD.agent
     OR NEW.run_id IS DISTINCT FROM OLD.run_id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'A proposal''s business, kind and run never change';
  END IF;
  IF OLD.status IN ('applied', 'rejected', 'expired') THEN
    RAISE EXCEPTION 'Proposal % is already %', OLD.id, OLD.status;
  END IF;
  IF NEW.payload IS DISTINCT FROM OLD.payload AND NOT (OLD.status = 'applying' AND NEW.status = 'applied' AND NEW.edits IS NOT NULL) THEN
    RAISE EXCEPTION 'A proposal''s payload changes only when a person approves it with edits';
  END IF;
  IF NEW.status = 'applied' AND OLD.status <> 'applying' THEN
    RAISE EXCEPTION 'A proposal is applied only once, after it is approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER proposals_rules BEFORE UPDATE OR DELETE ON proposals
  FOR EACH ROW EXECUTE FUNCTION be_proposal_rules();
--> statement-breakpoint

-- 2. What an agent did is history: events and steps are never changed or removed
--    (except with their business or run).
CREATE OR REPLACE FUNCTION be_agent_history_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND (current_setting('be.purge', true) = 'on' OR pg_trigger_depth() > 1) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER agent_events_append_only BEFORE UPDATE OR DELETE ON agent_events
  FOR EACH ROW EXECUTE FUNCTION be_agent_history_append_only();
--> statement-breakpoint
CREATE TRIGGER agent_steps_append_only BEFORE UPDATE OR DELETE ON agent_steps
  FOR EACH ROW EXECUTE FUNCTION be_agent_history_append_only();
