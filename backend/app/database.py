"""
数据库连接模块
"""
import time
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from .config import get_settings
from .logger import logger

settings = get_settings()

# 预定义 Base，供 models 导入
Base = declarative_base()


def check_mysql_server(max_retries: int = 10, retry_delay: int = 3) -> bool:
    """
    检查 MySQL 服务器是否可用
    
    Args:
        max_retries: 最大重试次数
        retry_delay: 重试间隔（秒）
    
    Returns:
        bool: 服务器是否可用
    """
    server_url = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/"
    
    for attempt in range(max_retries):
        try:
            temp_engine = create_engine(server_url, pool_pre_ping=True, connect_args={'connect_timeout': 5})
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            temp_engine.dispose()
            logger.info(f"MySQL 服务器连接成功: {settings.DB_HOST}:{settings.DB_PORT}")
            return True
        except OperationalError as e:
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            logger.warning(f"MySQL 服务器不可用 (尝试 {attempt + 1}/{max_retries}): {error_msg}")
            if attempt < max_retries - 1:
                logger.info(f"等待 {retry_delay} 秒后重试...")
                time.sleep(retry_delay)
    
    logger.error(f"无法连接到 MySQL 服务器 {settings.DB_HOST}:{settings.DB_PORT}，已重试 {max_retries} 次")
    return False


def ensure_database_exists() -> bool:
    """
    确保数据库存在，如果不存在则创建
    
    Returns:
        bool: 数据库是否就绪
    """
    server_url = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/"
    
    try:
        temp_engine = create_engine(server_url, pool_pre_ping=True)
        with temp_engine.connect() as conn:
            # 检查数据库是否存在
            result = conn.execute(text(f"SHOW DATABASES LIKE '{settings.DB_NAME}'"))
            exists = result.fetchone() is not None
            
            if not exists:
                logger.info(f"数据库 '{settings.DB_NAME}' 不存在，正在创建...")
                conn.execute(text(f"CREATE DATABASE `{settings.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                conn.commit()
                logger.info(f"数据库 '{settings.DB_NAME}' 创建成功")
            else:
                logger.info(f"数据库 '{settings.DB_NAME}' 已存在")
        
        temp_engine.dispose()
        return True
    except OperationalError as e:
        logger.error(f"创建数据库失败: {e}")
        return False


def check_tables_exist(engine) -> dict:
    """
    检查必要的表是否存在
    
    Returns:
        dict: 表名 -> 是否存在
    """
    required_tables = ['users', 'suppliers', 'materials', 'production_orders', 'production_records', 'material_usages']
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    return {table: table in existing_tables for table in required_tables}


def create_db_engine():
    """创建数据库引擎，带完整的初始化流程"""
    
    # 1. 检查 MySQL 服务器
    if not check_mysql_server():
        logger.error("MySQL 服务器不可用，请检查：")
        logger.error(f"  - 服务器地址: {settings.DB_HOST}:{settings.DB_PORT}")
        logger.error(f"  - 用户名: {settings.DB_USER}")
        logger.error("  - 确保 MySQL 服务已启动")
        logger.error("  - 确保网络连接正常")
        sys.exit(1)
    
    # 2. 确保数据库存在
    if not ensure_database_exists():
        logger.error(f"无法创建或访问数据库 '{settings.DB_NAME}'")
        sys.exit(1)
    
    # 3. 创建引擎连接到目标数据库
    try:
        eng = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20,
            echo=False
        )
        
        # 测试连接
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        logger.info("数据库引擎创建成功")
        return eng
    except OperationalError as e:
        logger.error(f"创建数据库引擎失败: {e}")
        sys.exit(1)


def init_tables(engine):
    """
    初始化数据库表结构
    
    如果表不存在，使用 SQLAlchemy 模型创建
    """
    table_status = check_tables_exist(engine)
    missing_tables = [t for t, exists in table_status.items() if not exists]
    
    if missing_tables:
        logger.info(f"缺少以下表，将自动创建: {missing_tables}")
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表结构初始化完成")
    else:
        logger.info("所有数据库表已存在")
    
    return True


# 创建引擎
engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"数据库操作异常: {e}")
        db.rollback()
        raise
    finally:
        db.close()
