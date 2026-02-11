"""
数据库模型定义 - 服装行业生产管理系统

字段说明请参考各模型类中 Column 的 comment 参数
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
