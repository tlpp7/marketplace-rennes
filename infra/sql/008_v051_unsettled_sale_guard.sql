-- V0.5.1: Fail closed at the database boundary until payment settlement exists.
-- A future payment migration must replace this guard with verified, idempotent
-- settlement evidence in the SAME transaction as the inventory transition.
CREATE OR REPLACE FUNCTION reject_unsettled_sale() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.state='sold' AND NEW.state IS DISTINCT FROM OLD.state THEN
  RAISE EXCEPTION 'Selling an item requires a verified payment settlement';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_reject_unsettled_sale ON consignment_inventory;
CREATE TRIGGER trg_reject_unsettled_sale BEFORE UPDATE OF state
 ON consignment_inventory FOR EACH ROW EXECUTE FUNCTION reject_unsettled_sale();
