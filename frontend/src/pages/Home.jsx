import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useToast } from '../components/Toast'

export default function Home() {
  const [stats, setStats] = useState({ orders: 0, materials: 0, suppliers: 0, records: 0 })
  const { showToast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/orders/'),
      api.get('/materials/'),
      api.get('/suppliers/'),
      api.get('/production/')
    ]).then(([o, m, s, r]) => {
      setStats({
        orders: o.data.length,
        materials: m.data.length,
        suppliers: s.data.length,
        records: r.data.length
      })
    }).catch(err => {
      showToast(err.friendlyMessage || '加载数据失败', 'error')
    })
  }, [])

  return (
    <div className="main-content fade-in">
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>欢迎回来 👋</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>这是您的生产数据概览</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div className="stat-value">{stats.orders}</div>
          <div className="stat-label">生产订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📦</div>
          <div className="stat-value">{stats.materials}</div>
          <div className="stat-label">物料种类</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🏢</div>
          <div className="stat-value">{stats.suppliers}</div>
          <div className="stat-label">供应商</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚙️</div>
          <div className="stat-value">{stats.records}</div>
          <div className="stat-label">生产记录</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">快速操作</h2>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/orders" className="btn btn-primary">新建订单</Link>
          <Link to="/materials" className="btn btn-secondary">添加物料</Link>
          <Link to="/production" className="btn btn-secondary">记录生产</Link>
        </div>
      </div>
    </div>
  )
}
