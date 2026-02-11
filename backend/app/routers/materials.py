"""
物料管理路由
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Material, User
from ..schemas import MaterialCreate, MaterialResponse
from ..auth import get_current_active_user
from ..logger import logger

router = APIRouter(prefix="/api/materials", tags=["物料管理"])


@router.get("/")
async def get_materials(
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取物料列表（分页）"""
    logger.info(f"用户 {current_user.username} 查询物料列表")
    total = db.query(Material).count()
    items = db.query(Material).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/", response_model=MaterialResponse)
async def create_material(
    material: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建物料"""
    existing = db.query(Material).filter(Material.code == material.code).first()
    if existing:
        logger.warning(f"创建物料失败: 编码 {material.code} 已存在")
        raise HTTPException(status_code=400, detail="物料编码已存在")
    
    db_material = Material(**material.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    logger.info(f"用户 {current_user.username} 创建物料: {material.code}")
    return db_material


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取单个物料"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        logger.warning(f"物料不存在: ID={material_id}")
        raise HTTPException(status_code=404, detail="物料不存在")
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    material_data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新物料"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        logger.warning(f"更新物料失败: ID={material_id} 不存在")
        raise HTTPException(status_code=404, detail="物料不存在")
    
    for key, value in material_data.model_dump().items():
        setattr(material, key, value)
    db.commit()
    db.refresh(material)
    logger.info(f"用户 {current_user.username} 更新物料: {material.code}")
    return material


@router.delete("/{material_id}")
async def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除物料"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        logger.warning(f"删除物料失败: ID={material_id} 不存在")
        raise HTTPException(status_code=404, detail="物料不存在")
    code = material.code
    db.delete(material)
    db.commit()
    logger.info(f"用户 {current_user.username} 删除物料: {code}")
    return {"message": "删除成功"}
