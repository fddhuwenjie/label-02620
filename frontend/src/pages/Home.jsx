import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useToast } from '../components/Toast'

const STATUS_MAP = {
  pending: { label: '待生产', color: 'warning' },
  in_progress: { label: '生产中', color: 'primary' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'danger' },
}

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data))
      .catch(err => showToast(err.friendlyMessage || '加载数据失败', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="main-content fade-in">
        <div className="loading-skeleton">
          <div className="skeleton-header" />
          <div className="skeleton-grid">
            {[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        </div>
      </div>
    )
  }

  const { overview, order_status, production, recent_orders } = data || {}

  return (
    <div className="main-content fade-in">
      {/* 欢迎区域 */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">数据概览</h1>
          <p className="dashboard-subtitle">实时掌握生产动态</p>
        </div>
        <div className="header-actions">
          <Link to="/orders" className="btn btn-primary">
            <span>＋</span> 新建订单
          </Link>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="metrics-grid">
        <div className="metric-card metric-blue">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-value">{overview?.total_orders || 0}</div>
            <div className="metric-label">生产订单</div>
            <div className="metric-trend">
              <span className="trend-badge trend-up">+{overview?.week_new_orders || 0}</span>
              <span className="trend-text">本周新增</span>
            </div>
          </div>
        </div>
        
        <div className="metric-card metric-green">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-value">{overview?.total_materials || 0}</div>
            <div className="metric-label">物料种类</div>
          </div>
        </div>
        
        <div className="metric-card metric-purple">
          <div className="metric-icon">🏭</div>
          <div className="metric-content">
            <div className="metric-value">{production?.today || 0}</div>
            <div className="metric-label">今日产量</div>
            <div className="metric-trend">
              <span className="trend-text">本周 {production?.week || 0} 件</span>
            </div>
          </div>
        </div>
        
        <div className="metric-card metric-orange">
          <div className="metric-icon">🏢</div>
          <div className="metric-content">
            <div className="metric-value">{overview?.total_suppliers || 0}</div>
            <div className="metric-label">供应商</div>
            <div className="metric-trend">
              <span className="trend-text">合作伙伴</span>
            </div>
          </div>
        </div>
      </div>

      {/* 订单状态概览 */}
      <div className="status-overview">
        <div className="status-item">
          <div className="status-dot status-pending" />
          <span className="status-count">{order_status?.pending || 0}</span>
          <span className="status-label">待生产</span>
        </div>
        <div className="status-item">
          <div className="status-dot status-progress" />
          <span className="status-count">{order_status?.in_progress || 0}</span>
          <span className="status-label">生产中</span>
        </div>
        <div className="status-item">
          <div className="status-dot status-completed" />
          <span className="status-count">{order_status?.completed || 0}</span>
          <span className="status-label">已完成</span>
        </div>
      </div>

      {/* 最近订单 */}
      <div className="dashboard-card" style={{ marginBottom: '32px' }}>
        <div className="dashboard-card-header">
          <h3>最近订单</h3>
          <Link to="/orders" className="view-all">查看全部 →</Link>
        </div>
        <div className="dashboard-card-body">
          {recent_orders?.length > 0 ? (
            <div className="order-list">
              {recent_orders.map(order => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <div className="order-name">{order.product_name}</div>
                    <div className="order-meta">
                      <span className="order-no">{order.order_no}</span>
                      <span className="order-qty">{order.quantity} 件</span>
                    </div>
                  </div>
                  <div className={`order-status status-${order.status}`}>
                    {STATUS_MAP[order.status]?.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-mini">
              <span>📋</span>
              <p>暂无订单</p>
            </div>
          )}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="quick-actions">
        <h3>快捷操作</h3>
        <div className="action-grid">
          <Link to="/orders" className="action-item">
            <div className="action-icon">📋</div>
            <span>订单管理</span>
          </Link>
          <Link to="/materials" className="action-item">
            <div className="action-icon">📦</div>
            <span>物料管理</span>
          </Link>
          <Link to="/production" className="action-item">
            <div className="action-icon">⚙️</div>
            <span>生产记录</span>
          </Link>
          <Link to="/suppliers" className="action-item">
            <div className="action-icon">🏢</div>
            <span>供应商</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
