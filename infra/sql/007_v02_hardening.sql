-- V0.2 hardening: prevent edits to archived evidence and validate passing inspection.
-- Additive, idempotent migration. Run AFTER 006_v02_operations.sql.
CREATE OR REPLACE FUNCTION prevent_consignment_evidence_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'Archived consignment evidence is immutable: %', TG_TABLE_NAME;
END $$;
DROP TRIGGER IF EXISTS trg_receipts_immutable ON consignment_receipts;
CREATE TRIGGER trg_receipts_immutable BEFORE UPDATE OR DELETE
 ON consignment_receipts FOR EACH ROW EXECUTE FUNCTION prevent_consignment_evidence_rewrite();
DROP TRIGGER IF EXISTS trg_quality_immutable ON consignment_quality_reports;
CREATE TRIGGER trg_quality_immutable BEFORE UPDATE OR DELETE
 ON consignment_quality_reports FOR EACH ROW EXECUTE FUNCTION prevent_consignment_evidence_rewrite();
DROP TRIGGER IF EXISTS trg_mandates_immutable ON consignment_mandates;
CREATE TRIGGER trg_mandates_immutable BEFORE UPDATE OR DELETE
 ON consignment_mandates FOR EACH ROW EXECUTE FUNCTION prevent_consignment_evidence_rewrite();
DROP TRIGGER IF EXISTS trg_publications_immutable ON consignment_publications;
CREATE TRIGGER trg_publications_immutable BEFORE UPDATE OR DELETE
 ON consignment_publications FOR EACH ROW EXECUTE FUNCTION prevent_consignment_evidence_rewrite();

DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='consignment_quality_reports'::regclass AND conname='consignment_positive_checks') THEN
  ALTER TABLE consignment_quality_reports ADD CONSTRAINT consignment_positive_checks
  CHECK (
   verdict <> 'passed' OR (
    checks->>'labelMatches' = 'true' AND
    checks->>'clean' = 'true' AND
    checks->>'conditionMatches' = 'true' AND
    checks->>'photoVerified' = 'true'
   )
  ) NOT VALID;
 END IF;
END $$;
-- NOT VALID still checks all new inserts and updates. Audit existing records before VALIDATE.
