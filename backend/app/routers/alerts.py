"""
库存预警路由模块

提供物料库存预警相关的API接口，包括获取预警列表和设置阈值功能。
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Material, User
from ..auth import get_current_active_user
from ..logger import logger

router = APIRouter(prefix="/api/materials", tags=["库存预警"])


class ThresholdUpdateRequest(BaseModel):
    """阈值更新请求模型"""
    min_stock: float = Field(..., ge=0, description="最低库存阈值，必须大于等于0")

    class Config:
        json_schema_extra = {
            "example": {"min_stock": 100}
        }


class MaterialAlertResponse(BaseModel):
    """物料预警响应模型"""
    id: int = Field(..., description="物料ID")
    code: str = Field(..., description="物料编码")
    name: str = Field(..., description="物料名称")
    category: str = Field(..., description="物料类别")
    unit: str = Field(..., description="计量单位")
    current_stock: float = Field(..., description="当前库存数量")
    min_stock: float = Field(..., description="最低库存阈值")
    shortage: float = Field(..., description="缺口数量（阈值 - 当前库存）")

    class Config:
        from_attributes = True


class AlertSummaryResponse(BaseModel):
    """预警摘要响应模型"""
    total_alerts: int = Field(..., description="预警物料总数")


@router.get("/alerts", response_model=List[MaterialAlertResponse])
async def get_material_alerts(
    search: Optional[str] = Query(None, description="按物料名称搜索"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[MaterialAlertResponse]:
    """
    获取库存预警物料列表

    返回当前库存低于最低库存阈值（min_stock）的所有物料，
    按缺口数量（shortage）降序排列。

    Args:
        search: 可选的物料名称搜索关键词
        db: 数据库会话
        current_user: 当前登录用户（JWT鉴权）

    Returns:
        List[MaterialAlertResponse]: 预警物料列表，包含物料信息和缺口数量
    """
    logger.info(f"用户 {current_user.username} 查询库存预警列表")

    query = db.query(
        Material.id,
        Material.code,
        Material.name,
        Material.category,
        Material.unit,
        Material.stock_quantity.label("current_stock"),
        Material.min_stock,
        (Material.min_stock - Material.stock_quantity).label("shortage")
    ).filter(
        Material.stock_quantity < Material.min_stock
    )

    if search:
        query = query.filter(Material.name.contains(search))

    results = query.order_by(
        func.coalesce(Material.min_stock - Material.stock_quantity, 0).desc()
    ).all()

    return [
        MaterialAlertResponse(
            id=row.id,
            code=row.code,
            name=row.name,
            category=row.category.value if hasattr(row.category, 'value') else row.category,
            unit=row.unit,
            current_stock=row.current_stock,
            min_stock=row.min_stock,
            shortage=row.shortage if row.shortage else 0
        )
        for row in results
    ]


@router.get("/alerts/summary", response_model=AlertSummaryResponse)
async def get_alert_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> AlertSummaryResponse:
    """
    获取预警摘要信息

    返回当前库存低于阈值的物料总数，用于Dashboard展示。

    Args:
        db: 数据库会话
        current_user: 当前登录用户（JWT鉴权）

    Returns:
        AlertSummaryResponse: 包含预警物料总数的摘要信息
    """
    count = db.query(Material).filter(
        Material.stock_quantity < Material.min_stock
    ).count()

    return AlertSummaryResponse(total_alerts=count)


@router.post("/{material_id}/threshold", response_model=dict)
async def update_material_threshold(
    material_id: int,
    request: ThresholdUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> dict:
    """
    设置单个物料的最低库存阈值

    Args:
        material_id: 物料ID
        request: 包含min_stock字段的请求体
        db: 数据库会话
        current_user: 当前登录用户（JWT鉴权）

    Returns:
        dict: 操作结果消息

    Raises:
        HTTPException: 物料不存在时返回404错误
    """
    material = db.query(Material).filter(Material.id == material_id).first()

    if not material:
        logger.warning(f"设置阈值失败: 物料 ID={material_id} 不存在")
        raise HTTPException(status_code=404, detail="物料不存在")

    old_threshold = material.min_stock
    material.min_stock = request.min_stock
    db.commit()
    db.refresh(material)

    logger.info(
        f"用户 {current_user.username} 更新物料 {material.code} 阈值: "
        f"{old_threshold} -> {request.min_stock}"
    )

    return {
        "message": "阈值设置成功",
        "material_id": material_id,
        "min_stock": request.min_stock
    }
