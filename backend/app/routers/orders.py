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
from ..logger import logger

router = APIRouter(prefix="/api/orders", tags=["生产订单"])


@router.get("/", response_model=List[ProductionOrderResponse])
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取订单列表"""
    logger.info(f"用户 {current_user.username} 查询订单列表")
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
        logger.warning(f"创建订单失败: 订单编号 {order.order_no} 已存在")
        raise HTTPException(status_code=400, detail="订单编号已存在")
    
    db_order = ProductionOrder(**order.model_dump(), created_by=current_user.id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    logger.info(f"用户 {current_user.username} 创建订单: {order.order_no}")
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
        logger.warning(f"订单不存在: ID={order_id}")
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
        logger.warning(f"更新订单失败: 订单 ID={order_id} 不存在")
        raise HTTPException(status_code=404, detail="订单不存在")
    
    for key, value in order_data.model_dump().items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    logger.info(f"用户 {current_user.username} 更新订单: {order.order_no}")
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
        logger.warning(f"删除订单失败: 订单 ID={order_id} 不存在")
        raise HTTPException(status_code=404, detail="订单不存在")
    order_no = order.order_no
    db.delete(order)
    db.commit()
    logger.info(f"用户 {current_user.username} 删除订单: {order_no}")
    return {"message": "删除成功"}
