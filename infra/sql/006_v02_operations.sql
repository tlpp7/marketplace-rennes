-- V0.2 : preuves immuables du processus de dépôt-vente.
-- Appliquer avec psql -X -v ON_ERROR_STOP=1 --single-transaction, après 001-005.
CREATE TABLE IF NOT EXISTS consignment_receipts (
 item_id uuid PRIMARY KEY REFERENCES consignment_inventory(id),
 receiver_id uuid NOT NULL REFERENCES users(id),
 proof_reference varchar(80) NOT NULL CHECK (length(trim(proof_reference)) >= 4),
 location_code varchar(48) NOT NULL CHECK (length(trim(location_code)) >= 2),
 notes varchar(1000) NOT NULL DEFAULT '',
 receipt_document text NOT NULL,
 receipt_sha256 char(64) NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS consignment_quality_reports (
 item_id uuid PRIMARY KEY REFERENCES consignment_inventory(id),
 inspector_id uuid NOT NULL REFERENCES users(id),
 verdict varchar(12) NOT NULL CHECK (verdict IN ('passed','rejected')),
 checks jsonb NOT NULL CHECK (jsonb_typeof(checks) = 'object'),
 notes varchar(1000) NOT NULL DEFAULT '',
 inspected_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS consignment_mandates (
 item_id uuid PRIMARY KEY REFERENCES consignment_inventory(id),
 owner_id uuid NOT NULL REFERENCES users(id),
 depositor_name varchar(160) NOT NULL,
 depositor_address varchar(350) NOT NULL,
 terms_version varchar(80) NOT NULL,
 document_text text NOT NULL,
 document_sha256 char(64) NOT NULL,
 accepted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS consignment_publications (
 item_id uuid PRIMARY KEY REFERENCES consignment_inventory(id),
 publisher_id uuid NOT NULL REFERENCES users(id),
 size_label varchar(40) NOT NULL CHECK (length(trim(size_label)) >= 1),
 photo_url varchar(1000) NOT NULL,
 public_description varchar(1500) NOT NULL CHECK (length(trim(public_description)) >= 20),
 published_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consignment_inventory_listed_idx ON consignment_inventory(state,updated_at DESC);
CREATE OR REPLACE FUNCTION enforce_consignment_workflow() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.state IS DISTINCT FROM OLD.state THEN
  IF NOT (
   (OLD.state='intake' AND NEW.state='quality_check') OR
   (OLD.state='quality_check' AND NEW.state IN ('ready','returned')) OR
   (OLD.state='ready' AND NEW.state IN ('listed','returned')) OR
   (OLD.state='listed' AND NEW.state IN ('reserved','returned')) OR
   (OLD.state='reserved' AND NEW.state IN ('listed','sold'))
  ) THEN
   RAISE EXCEPTION 'Transition de stock interdite % -> %', OLD.state, NEW.state;
  END IF;
  IF NEW.state='quality_check' AND (
    NOT EXISTS (SELECT 1 FROM consignment_receipts WHERE item_id=NEW.id) OR
    NOT EXISTS (SELECT 1 FROM consignment_mandates WHERE item_id=NEW.id)
  ) THEN
   RAISE EXCEPTION 'Réception ou mandat manquant';
  END IF;
  IF NEW.state='ready' AND NOT EXISTS
    (SELECT 1 FROM consignment_quality_reports WHERE item_id=NEW.id AND verdict='passed') THEN
   RAISE EXCEPTION 'Contrôle qualité positif manquant';
  END IF;
  IF OLD.state='quality_check' AND NEW.state='returned' AND NOT EXISTS
    (SELECT 1 FROM consignment_quality_reports WHERE item_id=NEW.id AND verdict='rejected') THEN
   RAISE EXCEPTION 'Contrôle qualité négatif manquant';
  END IF;
  IF NEW.state='listed' AND (
    NOT EXISTS (SELECT 1 FROM consignment_receipts WHERE item_id=NEW.id) OR
    NOT EXISTS (SELECT 1 FROM consignment_quality_reports WHERE item_id=NEW.id AND verdict='passed') OR
    NOT EXISTS (SELECT 1 FROM consignment_mandates WHERE item_id=NEW.id) OR
    NOT EXISTS (SELECT 1 FROM consignment_publications WHERE item_id=NEW.id)
  ) THEN
   RAISE EXCEPTION 'Publication bloquée : réception, qualité, mandat et fiche publique requis';
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_consignment_workflow ON consignment_inventory;
CREATE TRIGGER trg_enforce_consignment_workflow BEFORE UPDATE OF state
 ON consignment_inventory FOR EACH ROW EXECUTE FUNCTION enforce_consignment_workflow();
