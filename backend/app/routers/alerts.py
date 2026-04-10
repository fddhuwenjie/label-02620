"""
物料库存预警路由模块
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Material, User
from ..auth import get_current_active_user
from ..logger import logger

router = APIRouter(prefix="/api/materials", tags=["库存预警"])


class StockAlertResponse(BaseModel):
    """库存预警响应模型"""
    id: int
    name: str
    stock_quantity: float
    min_stock: float
    gap: float

    class Config:
        from_attributes = True


class ThresholdUpdateRequest(BaseModel):
    """阈值更新请求模型"""
    min_stock: float


@router.get("/alerts", response_model=List[StockAlertResponse])
async def get_stock_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[StockAlertResponse]:
    """
    获取当前库存低于阈值的物料列表
    返回字段包含：物料名、当前库存、阈值、缺口数量
    按缺口数量降序排列
    """
    logger.info(f"用户 {current_user.username} 查询库存预警列表")
    
    materials = (
        db.query(
            Material.id,
            Material.name,
            Material.stock_quantity,
            Material.min_stock,
            (Material.min_stock - Material.stock_quantity).label("gap")
        )
        .filter(Material.stock_quantity < Material.min_stock)
        .order_by(desc("gap"))
        .all()
    )
    
    result = []
    for mat in materials:
        result.append(StockAlertResponse(
            id=mat.id,
            name=mat.name,
            stock_quantity=mat.stock_quantity,
            min_stock=mat.min_stock,
            gap=mat.gap
        ))
    
    logger.info(f"查询到 {len(result)} 种预警物料")
    return result


@router.get("/alerts/count")
async def get_alert_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """获取预警物料总数"""
    logger.info(f"用户 {current_user.username} 查询预警数量")
    
    count = (
        db.query(Material)
        .filter(Material.stock_quantity < Material.min_stock)
        .count()
    )
    
    return {"count": count}


@router.post("/{material_id}/threshold", response_model=dict)
async def update_threshold(
    material_id: int,
    request: ThresholdUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """设置单个物料的最低库存阈值"""
    logger.info(
        f"用户 {current_user.username} 更新物料 ID={material_id} 的阈值为 {request.min_stock}"
    )
    
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        logger.warning(f"更新阈值失败: 物料 ID={material_id} 不存在")
        raise HTTPException(status_code=404, detail="物料不存在")
    
    material.min_stock = request.min_stock
    db.commit()
    db.refresh(material)
    
    logger.info(f"物料 {material.name} 的最低库存阈值已更新为 {request.min_stock}")
    return {
        "message": "阈值更新成功",
        "material_id": material_id,
        "min_stock": material.min_stock
    }
