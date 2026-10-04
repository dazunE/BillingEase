-- Every journal entry must balance: total debits = total credits.
-- Checked at commit time (deferred) so an entry's lines can be inserted one by one
-- inside a transaction.
CREATE OR REPLACE FUNCTION check_journal_entry_balanced() RETURNS trigger AS $$
DECLARE
  eid uuid;
  d bigint;
  c bigint;
BEGIN
  eid := COALESCE(NEW.entry_id, OLD.entry_id);
  SELECT COALESCE(SUM(debit_cents), 0), COALESCE(SUM(credit_cents), 0)
    INTO d, c FROM journal_lines WHERE entry_id = eid;
  IF d <> c THEN
    RAISE EXCEPTION 'Journal entry % is unbalanced: debits % <> credits %', eid, d, c;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER journal_lines_balanced
  AFTER INSERT OR UPDATE OR DELETE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_journal_entry_balanced();
