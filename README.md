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
- 前端界面：http://localhost:8081

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

我现在基于python开发程序，用来记录生产数据，想开发桌面端和安卓端的同步进行，主要是服装行业的物料、生产等环节的数据提交记录，首先连接数据库服务器，服务器信息192.168.1.26，用户名root，密码12345，数据库名为test_DB_2，还没有创建，具体数据库字段再文本内进行记录一遍后期维护，好的，现在开始编写

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
- **桌面端**：Electron
- **安卓端**：PWA（渐进式 Web 应用）
- **部署**：Docker + Docker Compose

### 多端支持说明

本项目同时支持桌面端和安卓端：

- **桌面端**：通过 Electron 打包，支持 Windows/macOS/Linux
- **安卓端**：通过 PWA 实现，用户在 Chrome 浏览器访问后可"添加到主屏幕"，像原生 App 一样使用

PWA 安装方法：

**前提条件：**
- 手机和服务器在同一局域网（同一 WiFi）下
- 或者应用已部署到公网服务器（需 HTTPS）

**局域网内安装步骤：**

1. 确保后端服务已启动（Docker 或本地启动）
2. 查看服务器 IP 地址（如 192.168.1.100）
3. 手机连接同一 WiFi
4. 安卓手机打开 Chrome 浏览器，访问 `http://服务器IP:8081`
5. 等待页面加载完成
6. 点击 Chrome 右上角 **⋮** 菜单
7. 选择 **"添加到主屏幕"** 或 **"安装应用"**
8. 输入应用名称，点击"添加"
9. 手机桌面会出现应用图标，点击即可全屏使用

**iPhone 安装：**
1. 用 Safari 浏览器访问应用地址
2. 点击底部分享按钮（方框+箭头图标）
3. 选择"添加到主屏幕"

**注意事项：**
- 局域网内使用 HTTP 即可，PWA 功能正常
- 公网部署必须使用 HTTPS，否则 PWA 无法安装
- 安装后可离线使用已缓存的页面

### 数据库自动连接

项目已内置默认数据库配置，拉取代码后无需配置 `.env` 文件即可自动连接：

| 配置项 | 默认值 |
|--------|--------|
| 服务器 | 192.168.1.26 |
| 端口 | 3306 |
| 用户名 | root |
| 密码 | 12345 |
| 数据库 | test_DB_2 |

如需连接其他数据库，可创建 `backend/.env` 文件覆盖默认配置。

## 桌面端（Electron）

### 开发模式

```bash
cd frontend
npm install
npm run electron:dev
```

这会同时启动 Vite 开发服务器和 Electron 窗口，支持热重载。

### 打包发布

```bash
# 打包当前平台
npm run electron:build

# 打包后的安装包在 frontend/dist-electron 目录
```

支持的平台：
- Windows: `.exe` 安装包 (NSIS)
- macOS: `.dmg` 安装包
- Linux: `.AppImage`

### 注意事项

1. 桌面端运行时需要后端服务在 `localhost:8620` 运行
2. 可以通过 Docker 启动后端，或本地启动
3. 打包前确保已执行 `npm run build` 构建前端资源

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

## 数据库初始化

### 方式一：Python 脚本（推荐）

```bash
cd backend
python -m scripts.init_db
```

脚本会自动：
1. 检查 MySQL 服务器连接
2. 创建数据库（如不存在）
3. 创建所有表结构
4. 显示初始化状态

### 方式二：SQL 脚本

```bash
# 创建表结构
mysql -u root -p < backend/scripts/init_schema.sql

# 导入初始数据（可选）
mysql -u root -p < backend/scripts/init_data.sql
```

### 数据库连接失败排查

如果遇到连接失败，请检查：
1. MySQL 服务是否已启动
2. `.env` 文件中的数据库配置是否正确
3. MySQL 用户是否有创建数据库的权限
4. 防火墙是否允许数据库端口访问
