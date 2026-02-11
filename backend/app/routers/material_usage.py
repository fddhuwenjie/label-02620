"""
物料使用记录路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import MaterialUsage, Material, ProductionOrder, User
from ..schemas import MaterialUsageCreate, MaterialUsageResponse
from ..auth import get_current_active_user

router = APIRouter(prefix="/api/material-usage", tags=["物料使用记录"])


@router.get("/", response_model=List[MaterialUsageResponse])
async def get_usages(
    order_id: int = None,
    material_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取物料使用记录列表"""
    query = db.query(MaterialUsage)
    if order_id:
        query = query.filter(MaterialUsage.order_id == order_id)
    if material_id:
        query = query.filter(MaterialUsage.material_id == material_id)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=MaterialUsageResponse)
async def create_usage(
    usage: MaterialUsageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建物料使用记录"""
    order = db.query(ProductionOrder).filter(ProductionOrder.id == usage.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    material = db.query(Material).filter(Material.id == usage.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="物料不存在")
    
    # 扣减库存
    if material.stock_quantity < usage.quantity_used:
        raise HTTPException(status_code=400, detail="库存不足")
    material.stock_quantity -= usage.quantity_used
    
    db_usage = MaterialUsage(**usage.model_dump(), operator_id=current_user.id)
    db.add(db_usage)
    db.commit()
    db.refresh(db_usage)
    return db_usage


@router.get("/{usage_id}", response_model=MaterialUsageResponse)
async def get_usage(
    usage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取单个物料使用记录"""
    usage = db.query(MaterialUsage).filter(MaterialUsage.id == usage_id).first()
    if not usage:
        raise HTTPException(status_code=404, detail="记录不存在")
    return usage


@router.delete("/{usage_id}")
async def delete_usage(
    usage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除物料使用记录"""
    usage = db.query(MaterialUsage).filter(MaterialUsage.id == usage_id).first()
    if not usage:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    # 恢复库存
    material = db.query(Material).filter(Material.id == usage.material_id).first()
    if material:
        material.stock_quantity += usage.quantity_used
    
    db.delete(usage)
    db.commit()
    return {"message": "删除成功"}
