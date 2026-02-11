-- ============================================
-- 服装生产管理系统 - 初始数据脚本
-- ============================================
-- 注意: 请先执行 init_schema.sql 创建表结构
-- ============================================

USE `test_DB_2`;

-- ============================================
-- 1. 初始化用户（密码均为 bcrypt 加密）
-- admin/admin123, operator/operator123
-- ============================================
INSERT IGNORE INTO `users` (`username`, `hashed_password`, `full_name`, `role`) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYWWQIqjSXHy', '系统管理员', 'admin'),
('operator', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '测试操作员', 'operator');

-- ============================================
-- 2. 初始化供应商
-- ============================================
INSERT IGNORE INTO `suppliers` (`code`, `name`, `contact_person`, `phone`, `address`) VALUES
('SUP001', '杭州丝绸面料厂', '张经理', '13800138001', '浙江省杭州市萧山区'),
('SUP002', '广州辅料批发中心', '李总', '13800138002', '广东省广州市白云区'),
('SUP003', '苏州纺织有限公司', '王主管', '13800138003', '江苏省苏州市吴江区');

-- ============================================
-- 3. 初始化物料
-- ============================================
INSERT IGNORE INTO `materials` (`code`, `name`, `category`, `unit`, `color`, `stock_quantity`, `min_stock`, `price`, `supplier_id`) VALUES
('MAT001', '纯棉面料', 'fabric', '米', '白色', 500, 100, 35.50, 1),
('MAT002', '涤纶面料', 'fabric', '米', '黑色', 300, 80, 28.00, 1),
('MAT003', '真丝面料', 'fabric', '米', '米色', 150, 50, 120.00, 3),
('MAT004', '金属拉链', 'accessory', '条', '银色', 1000, 200, 2.50, 2),
('MAT005', '塑料纽扣', 'accessory', '颗', '黑色', 5000, 1000, 0.30, 2),
('MAT006', '服装吊牌', 'packaging', '张', '白色', 2000, 500, 0.50, 2);

-- ============================================
-- 4. 初始化生产订单
-- ============================================
INSERT IGNORE INTO `production_orders` (`order_no`, `product_name`, `style_no`, `quantity`, `status`, `priority`, `customer_name`) VALUES
('PO2024001', '男士休闲衬衫', 'CS-M-001', 500, 'in_progress', 2, '优衣库'),
('PO2024002', '女士连衣裙', 'DR-F-002', 300, 'pending', 1, 'ZARA'),
('PO2024003', '儿童T恤', 'TS-K-003', 800, 'completed', 3, '巴拉巴拉'),
('PO2024004', '男士西装外套', 'SU-M-004', 200, 'in_progress', 2, '海澜之家');

-- ============================================
-- 5. 初始化生产记录
-- ============================================
INSERT IGNORE INTO `production_records` (`order_id`, `process_name`, `quantity_completed`, `quantity_defective`, `work_station`) VALUES
(1, 'cutting', 500, 5, '裁剪车间A'),
(1, 'sewing', 320, 8, '缝制车间B'),
(3, 'cutting', 800, 3, '裁剪车间A'),
(3, 'sewing', 800, 12, '缝制车间C'),
(3, 'quality_check', 785, 0, '质检车间');

-- ============================================
-- 初始化完成
-- ============================================
SELECT '初始数据导入完成！' AS message;
SELECT 
  (SELECT COUNT(*) FROM users) AS '用户数',
  (SELECT COUNT(*) FROM suppliers) AS '供应商数',
  (SELECT COUNT(*) FROM materials) AS '物料数',
  (SELECT COUNT(*) FROM production_orders) AS '订单数',
  (SELECT COUNT(*) FROM production_records) AS '生产记录数';
