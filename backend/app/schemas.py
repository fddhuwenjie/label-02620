"""
Pydantic 数据验证模型
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from .models import UserRole, MaterialCategory, OrderStatus, ProcessName


# ============ Token ============
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ============ User ============
class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.operator


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Supplier ============
class SupplierBase(BaseModel):
    code: str
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Material ============
class MaterialBase(BaseModel):
    code: str
    name: str
    category: MaterialCategory
    unit: str = "件"
    specification: Optional[str] = None
    color: Optional[str] = None
    supplier_id: Optional[int] = None
    stock_quantity: float = 0
    min_stock: float = 0
    price: float = 0


class MaterialCreate(MaterialBase):
    pass


class MaterialResponse(MaterialBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ ProductionOrder ============
class ProductionOrderBase(BaseModel):
    order_no: str
    product_name: str
    style_no: Optional[str] = None
    quantity: int
    unit: str = "件"
    status: OrderStatus = OrderStatus.pending
    priority: int = 3
    deadline: Optional[datetime] = None
    customer_name: Optional[str] = None
    remarks: Optional[str] = None


class ProductionOrderCreate(ProductionOrderBase):
    pass


class ProductionOrderResponse(ProductionOrderBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ ProductionRecord ============
class ProductionRecordBase(BaseModel):
    order_id: int
    process_name: ProcessName
    quantity_completed: int = 0
    quantity_defective: int = 0
    work_station: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    remarks: Optional[str] = None


class ProductionRecordCreate(ProductionRecordBase):
    pass


class ProductionRecordResponse(ProductionRecordBase):
    id: int
    operator_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ MaterialUsage ============
class MaterialUsageBase(BaseModel):
    order_id: int
    material_id: int
    quantity_used: float
    usage_date: Optional[datetime] = None
    remarks: Optional[str] = None


class MaterialUsageCreate(MaterialUsageBase):
    pass


class MaterialUsageResponse(MaterialUsageBase):
    id: int
    operator_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
