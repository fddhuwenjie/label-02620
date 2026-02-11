# 服装生产管理系统

## How to Run

### Docker 启动（推荐）

```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

启动后访问：
- 前端界面：http://localhost
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 本地启动

**后端：**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 创建 .env 文件（参考 .env.example）
cp .env.example .env

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**前端：**
```bash
cd frontend
npm install
npm run dev
```

前端开发服务器：http://localhost:3000

## Services

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 80 | React 前端应用 |
| backend | 8000 | FastAPI 后端 API |
| db | 3306 | MySQL 数据库 |

### API 接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户
- `GET/POST /api/materials/` - 物料管理
- `GET/POST /api/suppliers/` - 供应商管理
- `GET/POST /api/orders/` - 生产订单管理
- `GET/POST /api/production/` - 生产记录
- `GET/POST /api/material-usage/` - 物料使用记录

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 操作员 |

## 题目内容

开发一个服装行业生产数据管理系统，支持桌面端和安卓端同步使用。

### 功能需求

1. **用户认证**：登录、注册、JWT 认证
2. **物料管理**：面料、辅料、包装材料的增删改查
3. **供应商管理**：供应商信息维护
4. **生产订单**：订单创建、状态跟踪
5. **生产记录**：各工序（裁剪、缝制、熨烫、包装、质检）数据记录
6. **物料使用**：生产过程中物料消耗记录，自动扣减库存

### 技术栈

- **后端**：Python + FastAPI + SQLAlchemy + MySQL
- **前端**：React + Vite + React Router
- **部署**：Docker + Docker Compose

### 数据库设计

详见 `backend/app/models.py` 文件头部注释，包含以下表：
- users（用户表）
- suppliers（供应商表）
- materials（物料表）
- production_orders（生产订单表）
- production_records（生产记录表）
- material_usages（物料使用记录表）

### 配置说明

#### 数据库配置（唯一配置源）

所有数据库连接信息集中在此处管理，其他配置文件通过环境变量引用：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| DB_HOST | 192.168.1.26 | 数据库地址（Docker 环境自动使用 `db`） |
| DB_PORT | 3306 | 数据库端口 |
| DB_USER | root | 数据库用户名 |
| DB_PASSWORD | 12345 | 数据库密码（生产环境请修改） |
| DB_NAME | test_DB_2 | 数据库名称 |

#### JWT 配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| SECRET_KEY | your-secret-key-change-in-production | JWT 密钥（生产环境必须修改） |
| ALGORITHM | HS256 | 加密算法 |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30 | Token 过期时间（分钟） |

#### 配置文件说明

- `backend/.env` - 本地开发环境配置，从上表复制值
- `backend/.env.example` - 配置模板，不含实际密码
- `docker-compose.yml` - Docker 部署配置，使用环境变量
- `backend/app/config.py` - 配置加载模块，无硬编码默认值

⚠️ 生产环境部署前，请务必修改 `DB_PASSWORD` 和 `SECRET_KEY`。
