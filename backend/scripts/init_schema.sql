-- ============================================
-- 服装生产管理系统 - 数据库初始化脚本
-- ============================================
-- 使用方法:
--   mysql -u root -p < init_schema.sql
-- 或在 MySQL 客户端中执行:
--   source /path/to/init_schema.sql
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `test_DB_2` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `test_DB_2`;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `hashed_password` VARCHAR(255) NOT NULL COMMENT '加密密码',
  `full_name` VARCHAR(100) COMMENT '姓名',
  `role` ENUM('admin', 'manager', 'operator') DEFAULT 'operator' COMMENT '角色',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 供应商表
-- ============================================
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT '供应商编码',
  `name` VARCHAR(200) NOT NULL COMMENT '供应商名称',
  `contact_person` VARCHAR(100) COMMENT '联系人',
  `phone` VARCHAR(20) COMMENT '联系电话',
  `address` VARCHAR(500) COMMENT '地址',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商表';

-- ============================================
-- 3. 物料表
-- ============================================
CREATE TABLE IF NOT EXISTS `materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT '物料编码',
  `name` VARCHAR(200) NOT NULL COMMENT '物料名称',
  `category` ENUM('fabric', 'accessory', 'packaging') NOT NULL COMMENT '物料类别',
  `unit` VARCHAR(20) DEFAULT '件' COMMENT '计量单位',
  `specification` VARCHAR(500) COMMENT '规格说明',
  `color` VARCHAR(50) COMMENT '颜色',
  `supplier_id` INT COMMENT '供应商ID',
  `stock_quantity` FLOAT DEFAULT 0 COMMENT '库存数量',
  `min_stock` FLOAT DEFAULT 0 COMMENT '最低库存预警',
  `price` FLOAT DEFAULT 0 COMMENT '单价',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_code` (`code`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料表';

-- ============================================
-- 4. 生产订单表
-- ============================================
CREATE TABLE IF NOT EXISTS `production_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_no` VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
  `product_name` VARCHAR(200) NOT NULL COMMENT '产品名称',
  `style_no` VARCHAR(50) COMMENT '款号',
  `quantity` INT NOT NULL COMMENT '订单数量',
  `unit` VARCHAR(20) DEFAULT '件' COMMENT '单位',
  `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  `priority` INT DEFAULT 3 COMMENT '优先级1-5',
  `deadline` DATETIME COMMENT '交货日期',
  `customer_name` VARCHAR(200) COMMENT '客户名称',
  `remarks` TEXT COMMENT '备注',
  `created_by` INT COMMENT '创建人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产订单表';

-- ============================================
-- 5. 生产记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `production_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL COMMENT '关联订单ID',
  `process_name` ENUM('cutting', 'sewing', 'ironing', 'packaging', 'quality_check') NOT NULL COMMENT '工序名称',
  `quantity_completed` INT DEFAULT 0 COMMENT '完成数量',
  `quantity_defective` INT DEFAULT 0 COMMENT '不良品数量',
  `operator_id` INT COMMENT '操作员ID',
  `work_station` VARCHAR(50) COMMENT '工位',
  `start_time` DATETIME COMMENT '开始时间',
  `end_time` DATETIME COMMENT '结束时间',
  `remarks` TEXT COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  INDEX `idx_order_id` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `production_orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产记录表';

-- ============================================
-- 6. 物料使用记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `material_usages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL COMMENT '关联订单ID',
  `material_id` INT NOT NULL COMMENT '物料ID',
  `quantity_used` FLOAT NOT NULL COMMENT '使用数量',
  `operator_id` INT COMMENT '操作员ID',
  `usage_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '使用日期',
  `remarks` TEXT COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_material_id` (`material_id`),
  FOREIGN KEY (`order_id`) REFERENCES `production_orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料使用记录表';

-- ============================================
-- 初始化完成提示
-- ============================================
SELECT '数据库初始化完成！' AS message;
SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'test_DB_2';
