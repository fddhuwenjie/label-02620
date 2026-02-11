#!/usr/bin/env python3
"""
数据库初始化脚本
独立运行以创建数据库和表结构

使用方法:
    cd backend
    python -m scripts.init_db

或者使用 SQL 脚本:
    mysql -u root -p < scripts/init_schema.sql
    mysql -u root -p < scripts/init_data.sql
"""
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.database import check_mysql_server, ensure_database_exists, engine, Base, init_tables, check_tables_exist
from app.logger import logger


def init_database():
    """初始化数据库：创建数据库和所有表"""
    settings = get_settings()
    
    print("=" * 50)
    print("服装生产管理系统 - 数据库初始化")
    print("=" * 50)
    print(f"目标服务器: {settings.DB_HOST}:{settings.DB_PORT}")
    print(f"目标数据库: {settings.DB_NAME}")
    print("=" * 50)
    
    # 1. 检查 MySQL 服务器
    print("\n[1/4] 检查 MySQL 服务器...")
    if not check_mysql_server(max_retries=3, retry_delay=2):
        print("❌ MySQL 服务器不可用")
        print("\n请检查:")
        print(f"  - MySQL 服务是否已启动")
        print(f"  - 服务器地址是否正确: {settings.DB_HOST}:{settings.DB_PORT}")
        print(f"  - 用户名密码是否正确: {settings.DB_USER}")
        sys.exit(1)
    print("✓ MySQL 服务器连接成功")
    
    # 2. 确保数据库存在
    print("\n[2/4] 检查/创建数据库...")
    if not ensure_database_exists():
        print(f"❌ 无法创建数据库 '{settings.DB_NAME}'")
        sys.exit(1)
    print(f"✓ 数据库 '{settings.DB_NAME}' 已就绪")
    
    # 3. 导入模型
    print("\n[3/4] 加载数据模型...")
    from app import models  # 导入所有模型以注册到 Base
    print("✓ 数据模型加载完成")
    
    # 4. 创建表结构
    print("\n[4/4] 初始化表结构...")
    init_tables(engine)
    
    # 显示表状态
    table_status = check_tables_exist(engine)
    print("\n数据库表状态:")
    for table, exists in table_status.items():
        status = "✓" if exists else "✗"
        print(f"  {status} {table}")
    
    print("\n" + "=" * 50)
    print("✓ 数据库初始化完成！")
    print("=" * 50)
    print("\n提示: 启动应用后会自动创建测试账号")
    print("  - admin / admin123 (管理员)")
    print("  - operator / operator123 (操作员)")


if __name__ == "__main__":
    init_database()
