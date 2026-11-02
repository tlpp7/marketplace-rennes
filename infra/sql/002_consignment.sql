CREATE TABLE IF NOT EXISTS consignment_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES users(id),
 title varchar(160) NOT NULL,
 category varchar(80) NOT NULL,
 brand varchar(80) NOT NULL DEFAULT '',
 condition_label varchar(40) NOT NULL,
 estimated_price_cents integer NOT NULL CHECK(estimated_price_cents>=0),
 notes varchar(1000) NOT NULL DEFAULT '',
 status varchar(24) NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','accepted','declined','withdrawn')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consignment_requests_owner_idx ON consignment_requests(owner_id,created_at DESC);
CREATE TABLE IF NOT EXISTS consignment_inventory(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL UNIQUE REFERENCES consignment_requests(id),
 sku varchar(48) NOT NULL UNIQUE,
 location_code varchar(48) NOT NULL DEFAULT '',
 list_price_cents integer NOT NULL CHECK(list_price_cents>=0),
 commission_bps integer NOT NULL CHECK(commission_bps BETWEEN 0 AND 10000),
 state varchar(24) NOT NULL DEFAULT 'intake' CHECK(state IN ('intake','quality_check','ready','listed','reserved','sold','returned')),
 received_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS stock_movements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 item_id uuid NOT NULL REFERENCES consignment_inventory(id),
 actor_id uuid NOT NULL REFERENCES users(id),
 from_state varchar(24),
 to_state varchar(24) NOT NULL,
 description varchar(250) NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_item_idx ON stock_movements(item_id,created_at DESC);
