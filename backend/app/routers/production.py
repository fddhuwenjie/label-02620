"""
生产记录管理路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ProductionRecord, ProductionOrder, User
from ..schemas import ProductionRecordCreate, ProductionRecordResponse
from ..auth import get_current_active_user

router = APIRouter(prefix="/api/production", tags=["生产记录"])


@router.get("/")
async def get_records(
    order_id: int = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取生产记录列表（分页）"""
    query = db.query(ProductionRecord)
    if order_id:
        query = query.filter(ProductionRecord.order_id == order_id)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/", response_model=ProductionRecordResponse)
async def create_record(
    record: ProductionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建生产记录"""
    order = db.query(ProductionOrder).filter(ProductionOrder.id == record.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    db_record = ProductionRecord(**record.model_dump(), operator_id=current_user.id)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/{record_id}", response_model=ProductionRecordResponse)
async def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取单个生产记录"""
    record = db.query(ProductionRecord).filter(ProductionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.put("/{record_id}", response_model=ProductionRecordResponse)
async def update_record(
    record_id: int,
    record_data: ProductionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新生产记录"""
    record = db.query(ProductionRecord).filter(ProductionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    for key, value in record_data.model_dump().items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
async def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除生产记录"""
    record = db.query(ProductionRecord).filter(ProductionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"message": "删除成功"}
