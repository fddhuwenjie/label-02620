import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../api'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(err => {
        console.error('获取用户信息失败:', err.friendlyMessage)
      })
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path ? 'active' : ''
  const roleMap = { admin: '管理员', manager: '经理', operator: '操作员' }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="nav-brand">
            <span className="nav-brand-icon">🏭</span>
            <span>GarmentPro</span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">主菜单</div>
            <ul className="nav-links">
              <li><Link to="/" className={isActive('/')}><span className="nav-icon">🏠</span>首页概览</Link></li>
              <li><Link to="/orders" className={isActive('/orders')}><span className="nav-icon">📋</span>生产订单</Link></li>
              <li><Link to="/production" className={isActive('/production')}><span className="nav-icon">⚙️</span>生产记录</Link></li>
            </ul>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">资源管理</div>
            <ul className="nav-links">
              <li><Link to="/materials" className={isActive('/materials')}><span className="nav-icon">📦</span>物料管理</Link></li>
              <li><Link to="/stock-alerts" className={isActive('/stock-alerts')}><span className="nav-icon">⚠️</span>库存预警</Link></li>
              <li><Link to="/suppliers" className={isActive('/suppliers')}><span className="nav-icon">🏢</span>供应商</Link></li>
            </ul>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="nav-user">
            <div className="nav-avatar">{user?.full_name?.[0] || 'U'}</div>
            <div className="nav-user-info">
              <div className="nav-user-name">{user?.full_name || '用户'}</div>
              <div className="nav-user-role">{roleMap[user?.role] || '操作员'}</div>
            </div>
            <button onClick={logout} className="nav-logout" title="退出登录">⏻</button>
          </div>
        </div>
      </aside>
      <div className="mobile-nav">
        <ul className="mobile-nav-list">
          <li><Link to="/" className={isActive('/')}><span className="nav-icon">🏠</span>首页</Link></li>
          <li><Link to="/orders" className={isActive('/orders')}><span className="nav-icon">📋</span>订单</Link></li>
          <li><Link to="/materials" className={isActive('/materials')}><span className="nav-icon">📦</span>物料</Link></li>
          <li><Link to="/suppliers" className={isActive('/suppliers')}><span className="nav-icon">🏢</span>供应商</Link></li>
          <li><Link to="/production" className={isActive('/production')}><span className="nav-icon">⚙️</span>生产</Link></li>
        </ul>
      </div>
    </>
  )
}
