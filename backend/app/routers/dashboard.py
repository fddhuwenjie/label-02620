"""
首页仪表盘数据路由
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..database import get_db
from ..models import (
    ProductionOrder, Material, Supplier, ProductionRecord,
    OrderStatus, MaterialCategory
)
from ..auth import get_current_active_user, User

router = APIRouter(prefix="/api/dashboard", tags=["仪表盘"])


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取仪表盘统计数据"""
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    
    # 基础统计
    total_orders = db.query(ProductionOrder).count()
    total_materials = db.query(Material).count()
    total_suppliers = db.query(Supplier).count()
    total_records = db.query(ProductionRecord).count()
    
    # 订单状态统计
    pending_orders = db.query(ProductionOrder).filter(
        ProductionOrder.status == OrderStatus.pending
    ).count()
    in_progress_orders = db.query(ProductionOrder).filter(
        ProductionOrder.status == OrderStatus.in_progress
    ).count()
    completed_orders = db.query(ProductionOrder).filter(
        ProductionOrder.status == OrderStatus.completed
    ).count()
    
    # 本周新增订单
    week_new_orders = db.query(ProductionOrder).filter(
        func.date(ProductionOrder.created_at) >= week_ago
    ).count()
    
    # 库存预警（库存低于最低库存的物料）
    low_stock_materials = db.query(Material).filter(
        Material.stock_quantity <= Material.min_stock
    ).all()
    
    # 最近订单（最新5条）
    recent_orders = db.query(ProductionOrder).order_by(
        ProductionOrder.created_at.desc()
    ).limit(5).all()
    
    # 今日生产数量
    today_production = db.query(func.sum(ProductionRecord.quantity_completed)).filter(
        func.date(ProductionRecord.created_at) == today
    ).scalar() or 0
    
    # 本周生产数量
    week_production = db.query(func.sum(ProductionRecord.quantity_completed)).filter(
        func.date(ProductionRecord.created_at) >= week_ago
    ).scalar() or 0
    
    # 物料分类统计
    material_by_category = {}
    for cat in MaterialCategory:
        count = db.query(Material).filter(Material.category == cat).count()
        material_by_category[cat.value] = count
    
    return {
        "overview": {
            "total_orders": total_orders,
            "total_materials": total_materials,
            "total_suppliers": total_suppliers,
            "total_records": total_records,
            "week_new_orders": week_new_orders,
        },
        "order_status": {
            "pending": pending_orders,
            "in_progress": in_progress_orders,
            "completed": completed_orders,
        },
        "production": {
            "today": today_production,
            "week": week_production,
        },
        "low_stock_materials": [
            {
                "id": m.id,
                "code": m.code,
                "name": m.name,
                "stock_quantity": m.stock_quantity,
                "min_stock": m.min_stock,
                "unit": m.unit,
            }
            for m in low_stock_materials[:5]
        ],
        "recent_orders": [
            {
                "id": o.id,
                "order_no": o.order_no,
                "product_name": o.product_name,
                "quantity": o.quantity,
                "status": o.status.value,
                "deadline": o.deadline.isoformat() if o.deadline else None,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders
        ],
        "material_by_category": material_by_category,
    }
