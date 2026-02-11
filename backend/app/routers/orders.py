"""
生产订单管理路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ProductionOrder, User
from ..schemas import ProductionOrderCreate, ProductionOrderResponse
from ..auth import get_current_active_user

router = APIRouter(prefix="/api/orders", tags=["生产订单"])


@router.get("/", response_model=List[ProductionOrderResponse])
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取订单列表"""
    return db.query(ProductionOrder).offset(skip).limit(limit).all()


@router.post("/", response_model=ProductionOrderResponse)
async def create_order(
    order: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建订单"""
    existing = db.query(ProductionOrder).filter(ProductionOrder.order_no == order.order_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="订单编号已存在")
    
    db_order = ProductionOrder(**order.model_dump(), created_by=current_user.id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/{order_id}", response_model=ProductionOrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取单个订单"""
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.put("/{order_id}", response_model=ProductionOrderResponse)
async def update_order(
    order_id: int,
    order_data: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新订单"""
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    for key, value in order_data.model_dump().items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除订单"""
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    db.delete(order)
    db.commit()
    return {"message": "删除成功"}
