CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  price_cents INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  stock_qty INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menu_items_availability_name (is_available, name)
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  customer_address VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  status ENUM('RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')
    NOT NULL DEFAULT 'RECEIVED',
  subtotal_cents INT NOT NULL,
  total_cents INT NOT NULL,
  last_status_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status_last_status_at (status, last_status_at),
  INDEX idx_orders_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  menu_item_id VARCHAR(64) NOT NULL,
  item_name_snapshot VARCHAR(120) NOT NULL,
  unit_price_cents INT NOT NULL,
  quantity INT NOT NULL,
  line_total_cents INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_menu_item_id (menu_item_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  status ENUM('RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')
    NOT NULL,
  notes VARCHAR(255) NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_status_history_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_status_history_order_id_changed_at (order_id, changed_at)
);
