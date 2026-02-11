"""
数据库模型定义 - 服装行业生产管理系统

数据库字段说明：
================

1. User (用户表)
   - id: 主键ID
   - username: 用户名（唯一）
   - hashed_password: 加密密码
   - full_name: 姓名
   - role: 角色（admin/manager/operator）
   - is_active: 是否启用
   - created_at: 创建时间
   - updated_at: 更新时间

2. Material (物料表)
   - id: 主键ID
   - code: 物料编码（唯一）
   - name: 物料名称
   - category: 物料类别（fabric面料/accessory辅料/packaging包装材料）
   - unit: 计量单位
   - specification: 规格说明
   - color: 颜色
   - supplier_id: 供应商ID（外键）
   - stock_quantity: 库存数量
   - min_stock: 最低库存预警
   - price: 单价
   - created_at: 创建时间
   - updated_at: 更新时间

3. Supplier (供应商表)
   - id: 主键ID
   - code: 供应商编码（唯一）
   - name: 供应商名称
   - contact_person: 联系人
   - phone: 联系电话
   - address: 地址
   - is_active: 是否启用
   - created_at: 创建时间

4. ProductionOrder (生产订单表)
   - id: 主键ID
   - order_no: 订单编号（唯一）
   - product_name: 产品名称
   - style_no: 款号
   - quantity: 订单数量
   - unit: 单位
   - status: 状态（pending待生产/in_progress生产中/completed已完成/cancelled已取消）
   - priority: 优先级（1-5）
   - deadline: 交货日期
   - customer_name: 客户名称
   - remarks: 备注
   - created_by: 创建人ID
   - created_at: 创建时间
   - updated_at: 更新时间

5. ProductionRecord (生产记录表)
   - id: 主键ID
   - order_id: 关联订单ID（外键）
   - process_name: 工序名称（cutting裁剪/sewing缝制/ironing熨烫/packaging包装/quality_check质检）
   - quantity_completed: 完成数量
   - quantity_defective: 不良品数量
   - operator_id: 操作员ID（外键）
   - work_station: 工位
   - start_time: 开始时间
   - end_time: 结束时间
   - remarks: 备注
   - created_at: 记录时间

6. MaterialUsage (物料使用记录表)
   - id: 主键ID
   - order_id: 关联订单ID（外键）
   - material_id: 物料ID（外键）
   - quantity_used: 使用数量
   - operator_id: 操作员ID（外键）
   - usage_date: 使用日期
   - remarks: 备注
   - created_at: 记录时间
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from .database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    operator = "operator"


class MaterialCategory(str, enum.Enum):
    fabric = "fabric"           # 面料
    accessory = "accessory"     # 辅料
    packaging = "packaging"     # 包装材料


class OrderStatus(str, enum.Enum):
    pending = "pending"             # 待生产
    in_progress = "in_progress"     # 生产中
    completed = "completed"         # 已完成
    cancelled = "cancelled"         # 已取消


class ProcessName(str, enum.Enum):
    cutting = "cutting"             # 裁剪
    sewing = "sewing"               # 缝制
    ironing = "ironing"             # 熨烫
    packaging = "packaging"         # 包装
    quality_check = "quality_check" # 质检


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    hashed_password = Column(String(255), nullable=False, comment="加密密码")
    full_name = Column(String(100), comment="姓名")
    role = Column(Enum(UserRole), default=UserRole.operator, comment="角色")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联
    production_records = relationship("ProductionRecord", back_populates="operator")
    material_usages = relationship("MaterialUsage", back_populates="operator")


class Supplier(Base):
    """供应商表"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, comment="供应商编码")
    name = Column(String(200), nullable=False, comment="供应商名称")
    contact_person = Column(String(100), comment="联系人")
    phone = Column(String(20), comment="联系电话")
    address = Column(String(500), comment="地址")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    
    # 关联
    materials = relationship("Material", back_populates="supplier")


class Material(Base):
    """物料表"""
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, comment="物料编码")
    name = Column(String(200), nullable=False, comment="物料名称")
    category = Column(Enum(MaterialCategory), nullable=False, comment="物料类别")
    unit = Column(String(20), default="件", comment="计量单位")
    specification = Column(String(500), comment="规格说明")
    color = Column(String(50), comment="颜色")
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), comment="供应商ID")
    stock_quantity = Column(Float, default=0, comment="库存数量")
    min_stock = Column(Float, default=0, comment="最低库存预警")
    price = Column(Float, default=0, comment="单价")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联
    supplier = relationship("Supplier", back_populates="materials")
    usages = relationship("MaterialUsage", back_populates="material")


class ProductionOrder(Base):
    """生产订单表"""
    __tablename__ = "production_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False, comment="订单编号")
    product_name = Column(String(200), nullable=False, comment="产品名称")
    style_no = Column(String(50), comment="款号")
    quantity = Column(Integer, nullable=False, comment="订单数量")
    unit = Column(String(20), default="件", comment="单位")
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, comment="状态")
    priority = Column(Integer, default=3, comment="优先级1-5")
    deadline = Column(DateTime, comment="交货日期")
    customer_name = Column(String(200), comment="客户名称")
    remarks = Column(Text, comment="备注")
    created_by = Column(Integer, ForeignKey("users.id"), comment="创建人ID")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联
    production_records = relationship("ProductionRecord", back_populates="order")
    material_usages = relationship("MaterialUsage", back_populates="order")


class ProductionRecord(Base):
    """生产记录表"""
    __tablename__ = "production_records"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False, comment="关联订单ID")
    process_name = Column(Enum(ProcessName), nullable=False, comment="工序名称")
    quantity_completed = Column(Integer, default=0, comment="完成数量")
    quantity_defective = Column(Integer, default=0, comment="不良品数量")
    operator_id = Column(Integer, ForeignKey("users.id"), comment="操作员ID")
    work_station = Column(String(50), comment="工位")
    start_time = Column(DateTime, comment="开始时间")
    end_time = Column(DateTime, comment="结束时间")
    remarks = Column(Text, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow, comment="记录时间")
    
    # 关联
    order = relationship("ProductionOrder", back_populates="production_records")
    operator = relationship("User", back_populates="production_records")


class MaterialUsage(Base):
    """物料使用记录表"""
    __tablename__ = "material_usages"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("production_orders.id"), nullable=False, comment="关联订单ID")
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, comment="物料ID")
    quantity_used = Column(Float, nullable=False, comment="使用数量")
    operator_id = Column(Integer, ForeignKey("users.id"), comment="操作员ID")
    usage_date = Column(DateTime, default=datetime.utcnow, comment="使用日期")
    remarks = Column(Text, comment="备注")
    created_at = Column(DateTime, default=datetime.utcnow, comment="记录时间")
    
    # 关联
    order = relationship("ProductionOrder", back_populates="material_usages")
    material = relationship("Material", back_populates="usages")
    operator = relationship("User", back_populates="material_usages")
