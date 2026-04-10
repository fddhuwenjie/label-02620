"""
物料库存预警路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from ..database import get_db
from ..models import Material, User
from ..auth import get_current_active_user
from ..logger import logger


class MaterialAlertResponse(BaseModel):
    id: int
    name: str
    stock_quantity: float
    min_stock: float
    gap: float

    class Config:
        from_attributes = True


class MinStockUpdate(BaseModel):
    min_stock: float


router = APIRouter(prefix="/api/materials", tags=["库存预警"])


@router.get("/alerts", response_model=List[MaterialAlertResponse])
async def get_material_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[MaterialAlertResponse]:
    """获取当前库存低于阈值的物料列表，按缺口数量降序排列"""
    logger.info(f"用户 {current_user.username} 查询库存预警列表")
    materials = db.query(Material).filter(
        Material.stock_quantity < Material.min_stock
    ).all()
    
    result = []
    for material in materials:
        gap = material.min_stock - material.stock_quantity
        result.append({
            "id": material.id,
            "name": material.name,
            "stock_quantity": material.stock_quantity,
            "min_stock": material.min_stock,
            "gap": gap
        })
    
    result.sort(key=lambda x: x["gap"], reverse=True)
    
    return result


@router.get("/alerts/count")
async def get_alert_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """获取当前预警物料总数"""
    logger.info(f"用户 {current_user.username} 查询预警数量")
    count = db.query(Material).filter(
        Material.stock_quantity < Material.min_stock
    ).count()
    return {"count": count}


@router.post("/{material_id}/threshold")
async def update_material_threshold(
    material_id: int,
    threshold_data: MinStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """设置单个物料的最低库存阈值"""
    logger.info(f"用户 {current_user.username} 更新物料 ID={material_id} 的阈值")
    
    if threshold_data.min_stock < 0:
        raise HTTPException(status_code=400, detail="最低库存阈值不能为负数")
    
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        logger.warning(f"更新阈值失败: 物料 ID={material_id} 不存在")
        raise HTTPException(status_code=404, detail="物料不存在")
    
    material.min_stock = threshold_data.min_stock
    db.commit()
    db.refresh(material)
    
    logger.info(f"物料 {material.name} 的最低库存阈值已设置为 {threshold_data.min_stock}")
    return {
        "message": "阈值更新成功",
        "material_id": material_id,
        "min_stock": material.min_stock
    }
