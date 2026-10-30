-- A proposal's target never changes either (see 0003).
CREATE OR REPLACE FUNCTION be_proposal_target_fixed() RETURNS trigger AS $$
BEGIN
  IF NEW.target_id IS DISTINCT FROM OLD.target_id THEN
    RAISE EXCEPTION 'A proposal''s target never changes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER proposals_target_fixed BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION be_proposal_target_fixed();
--> statement-breakpoint

-- What a statement says is kept as imported: a line's date, words and amount never change.
-- Its status, match and suggestion do, as it is matched.
CREATE OR REPLACE FUNCTION be_statement_line_fixed() RETURNS trigger AS $$
BEGIN
  IF NEW.statement_id <> OLD.statement_id OR NEW.business_id <> OLD.business_id OR NEW.seq <> OLD.seq OR NEW.date <> OLD.date
     OR NEW.description <> OLD.description OR NEW.amount <> OLD.amount OR NEW.balance IS DISTINCT FROM OLD.balance THEN
    RAISE EXCEPTION 'Statement lines are kept as imported; import a corrected statement instead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER bank_statement_lines_fixed BEFORE UPDATE ON bank_statement_lines
  FOR EACH ROW EXECUTE FUNCTION be_statement_line_fixed();
