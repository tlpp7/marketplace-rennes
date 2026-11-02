-- V0.5: orders remain manually confirmed; no payment collection.
CREATE TABLE IF NOT EXISTS marketplace_orders(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 buyer_id uuid NOT NULL REFERENCES users(id),
 inventory_id uuid NOT NULL UNIQUE REFERENCES consignment_inventory(id),
 price_cents integer NOT NULL CHECK(price_cents>=0),
 status varchar(24) NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','cancelled','awaiting_payment','paid','fulfilling','shipped','completed','refunded')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketplace_orders_buyer_idx ON marketplace_orders(buyer_id,created_at DESC);
CREATE TABLE IF NOT EXISTS shipments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL UNIQUE REFERENCES marketplace_orders(id),
 method varchar(24) NOT NULL CHECK(method IN ('pickup','carrier')),
 carrier varchar(80),
 tracking_reference varchar(120),
 status varchar(24) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','preparing','dispatched','delivered','cancelled')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payment_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES marketplace_orders(id),
 provider varchar(60) NOT NULL,
 provider_event_id varchar(200) NOT NULL UNIQUE,
 event_type varchar(60) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
