-- Ledger rules the database enforces, whatever the application does.

-- 1. Every journal entry balances: total debits = total credits. Checked at commit
--    (deferred) so an entry's lines can be inserted one by one in a transaction.
CREATE OR REPLACE FUNCTION be_check_entry_balanced() RETURNS trigger AS $$
DECLARE
  eid uuid;
  d bigint;
  c bigint;
BEGIN
  eid := COALESCE(NEW.entry_id, OLD.entry_id);
  IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE id = eid) THEN
    RETURN NULL; -- the entry itself was removed with its business
  END IF;
  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0) INTO d, c FROM journal_lines WHERE entry_id = eid;
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
  FOR EACH ROW EXECUTE FUNCTION be_check_entry_balanced();
--> statement-breakpoint

-- 2. The ledger is append-only. Corrections post a reversing entry. The only change
--    allowed to an entry is marking it reversed; deleting is only possible when the
--    whole business is deleted (the transaction sets be.purge = 'on').
CREATE OR REPLACE FUNCTION be_ledger_append_only() RETURNS trigger AS $$
BEGIN
  IF current_setting('be.purge', true) = 'on' THEN
    RETURN COALESCE(OLD, NEW);
  END IF;
  IF TG_TABLE_NAME = 'journal_entries' AND TG_OP = 'UPDATE'
     AND NEW.id = OLD.id AND NEW.business_id = OLD.business_id AND NEW.entry_date = OLD.entry_date
     AND NEW.memo = OLD.memo AND NEW.source_type = OLD.source_type
     AND NEW.source_id IS NOT DISTINCT FROM OLD.source_id
     AND NEW.reverses_entry_id IS NOT DISTINCT FROM OLD.reverses_entry_id THEN
    RETURN NEW; -- marking reversed_at
  END IF;
  RAISE EXCEPTION 'The ledger is append-only: post a reversing entry instead of % on %', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER journal_entries_append_only
  BEFORE UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION be_ledger_append_only();
--> statement-breakpoint
CREATE TRIGGER journal_lines_append_only
  BEFORE UPDATE OR DELETE ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION be_ledger_append_only();
--> statement-breakpoint

-- 3. Nothing can be posted into a filed (locked) period.
CREATE OR REPLACE FUNCTION be_check_period_open() RETURNS trigger AS $$
DECLARE
  p record;
BEGIN
  SELECT label INTO p FROM locked_periods
   WHERE business_id = NEW.business_id AND NEW.entry_date BETWEEN from_date AND to_date
   LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'PERIOD_LOCKED: % is filed and locked', p.label USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER journal_entries_period_open
  BEFORE INSERT ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION be_check_period_open();
--> statement-breakpoint

-- 4. A line's account must belong to the same business as the line.
CREATE OR REPLACE FUNCTION be_check_line_account() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = NEW.account_id AND business_id = NEW.business_id) THEN
    RAISE EXCEPTION 'Account % does not belong to business %', NEW.account_id, NEW.business_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM journal_entries WHERE id = NEW.entry_id AND business_id = NEW.business_id) THEN
    RAISE EXCEPTION 'Entry % does not belong to business %', NEW.entry_id, NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER journal_lines_same_business
  BEFORE INSERT ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION be_check_line_account();
