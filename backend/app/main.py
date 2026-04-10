"""
服装行业生产数据管理系统 - 主入口
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from .database import engine, Base, init_tables
from .models import User
from .auth import get_password_hash
from sqlalchemy.orm import Session
from .routers import auth, materials, suppliers, orders, production, material_usage, dashboard, alerts
from .logger import logger

# 初始化数据库表结构
init_tables(engine)

app = FastAPI(
    title="服装生产管理系统",
    description="服装行业物料、生产等环节的数据提交记录系统",
    version="1.0.0"
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """全局数据库异常处理"""
    logger.error(f"数据库错误 [{request.method} {request.url.path}]: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "数据库操作失败，请稍后重试"}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    logger.error(f"未处理异常 [{request.method} {request.url.path}]: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误"}
    )

# CORS配置 - 从环境变量读取允许的来源
import os
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(materials.router)
app.include_router(suppliers.router)
app.include_router(orders.router)
app.include_router(production.router)
app.include_router(material_usage.router)
app.include_router(alerts.router)


@app.on_event("startup")
async def startup_event():
    """启动时初始化测试数据"""
    logger.info("应用启动，开始初始化数据...")
    from .database import SessionLocal
    from .models import Supplier, Material, ProductionOrder, ProductionRecord, MaterialCategory, OrderStatus, ProcessName
    db = SessionLocal()
    try:
        # 创建测试管理员账号
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="系统管理员",
                role="admin"
            )
            db.add(admin)
            logger.info("创建管理员账号: admin")
        
        # 创建测试操作员账号
        operator = db.query(User).filter(User.username == "operator").first()
        if not operator:
            operator = User(
                username="operator",
                hashed_password=get_password_hash("operator123"),
                full_name="测试操作员",
                role="operator"
            )
            db.add(operator)
            logger.info("创建操作员账号: operator")
        
        db.commit()
        
        # 初始化供应商数据
        if db.query(Supplier).count() == 0:
            suppliers_data = [
                Supplier(code="SUP001", name="杭州丝绸面料厂", contact_person="张经理", phone="13800138001", address="浙江省杭州市萧山区"),
                Supplier(code="SUP002", name="广州辅料批发中心", contact_person="李总", phone="13800138002", address="广东省广州市白云区"),
                Supplier(code="SUP003", name="苏州纺织有限公司", contact_person="王主管", phone="13800138003", address="江苏省苏州市吴江区"),
            ]
            db.add_all(suppliers_data)
            db.commit()
        
        # 初始化物料数据
        if db.query(Material).count() == 0:
            suppliers_list = db.query(Supplier).all()
            if len(suppliers_list) >= 3:
                materials = [
                    Material(code="MAT001", name="纯棉面料", category=MaterialCategory.fabric, unit="米", color="白色", stock_quantity=500, min_stock=100, price=35.5, supplier_id=suppliers_list[0].id),
                    Material(code="MAT002", name="涤纶面料", category=MaterialCategory.fabric, unit="米", color="黑色", stock_quantity=300, min_stock=80, price=28.0, supplier_id=suppliers_list[0].id),
                    Material(code="MAT003", name="真丝面料", category=MaterialCategory.fabric, unit="米", color="米色", stock_quantity=150, min_stock=50, price=120.0, supplier_id=suppliers_list[2].id),
                    Material(code="MAT004", name="金属拉链", category=MaterialCategory.accessory, unit="条", color="银色", stock_quantity=1000, min_stock=200, price=2.5, supplier_id=suppliers_list[1].id),
                    Material(code="MAT005", name="塑料纽扣", category=MaterialCategory.accessory, unit="颗", color="黑色", stock_quantity=5000, min_stock=1000, price=0.3, supplier_id=suppliers_list[1].id),
                    Material(code="MAT006", name="服装吊牌", category=MaterialCategory.packaging, unit="张", color="白色", stock_quantity=2000, min_stock=500, price=0.5, supplier_id=suppliers_list[1].id),
                ]
                db.add_all(materials)
                db.commit()
        
        # 初始化订单数据
        if db.query(ProductionOrder).count() == 0:
            orders_data = [
                ProductionOrder(order_no="PO2024001", product_name="男士休闲衬衫", style_no="CS-M-001", quantity=500, status=OrderStatus.in_progress, priority=2, customer_name="优衣库"),
                ProductionOrder(order_no="PO2024002", product_name="女士连衣裙", style_no="DR-F-002", quantity=300, status=OrderStatus.pending, priority=1, customer_name="ZARA"),
                ProductionOrder(order_no="PO2024003", product_name="儿童T恤", style_no="TS-K-003", quantity=800, status=OrderStatus.completed, priority=3, customer_name="巴拉巴拉"),
                ProductionOrder(order_no="PO2024004", product_name="男士西装外套", style_no="SU-M-004", quantity=200, status=OrderStatus.in_progress, priority=2, customer_name="海澜之家"),
            ]
            db.add_all(orders_data)
            db.commit()
        
        # 初始化生产记录
        if db.query(ProductionRecord).count() == 0:
            orders_list = db.query(ProductionOrder).all()
            if len(orders_list) >= 3:
                records = [
                    ProductionRecord(order_id=orders_list[0].id, process_name=ProcessName.cutting, quantity_completed=500, quantity_defective=5, work_station="裁剪车间A"),
                    ProductionRecord(order_id=orders_list[0].id, process_name=ProcessName.sewing, quantity_completed=320, quantity_defective=8, work_station="缝制车间B"),
                    ProductionRecord(order_id=orders_list[2].id, process_name=ProcessName.cutting, quantity_completed=800, quantity_defective=3, work_station="裁剪车间A"),
                    ProductionRecord(order_id=orders_list[2].id, process_name=ProcessName.sewing, quantity_completed=800, quantity_defective=12, work_station="缝制车间C"),
                    ProductionRecord(order_id=orders_list[2].id, process_name=ProcessName.quality_check, quantity_completed=785, quantity_defective=0, work_station="质检车间"),
                ]
                db.add_all(records)
                db.commit()
        
        logger.info("数据初始化完成")
    except Exception as e:
        logger.error(f"数据初始化失败: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "服装生产管理系统 API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
