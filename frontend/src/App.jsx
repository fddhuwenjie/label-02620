import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import api from './api'

// Toast Context
const ToastContext = createContext()

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const useToast = () => useContext(ToastContext)

// Modal 组件
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// 登录页
function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)
      const res = await api.post('/auth/login', formData)
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (err) {
      setError('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg"></div>
      <div className="login-card fade-in">
        <div className="login-logo">🏭</div>
        <h1 className="login-title">服装生产管理</h1>
        <p className="login-subtitle">智能化生产数据管理平台</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" required />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  )
}

// 侧边栏导航组件
function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data)).catch(() => {})
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
            <button onClick={logout} className="btn btn-ghost btn-icon" title="退出登录">🚪</button>
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

// 首页
function Home() {
  const [stats, setStats] = useState({ orders: 0, materials: 0, suppliers: 0, records: 0 })

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
    }).catch(() => {})
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

// 订单管理
function Orders() {
  const [orders, setOrders] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ order_no: '', product_name: '', style_no: '', quantity: '', customer_name: '', priority: '3', status: 'pending' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    const res = await api.get('/orders/')
    setOrders(res.data)
  }

  const validate = () => {
    const errs = {}
    if (!form.order_no.trim()) errs.order_no = '请输入订单编号'
    else if (!/^[A-Za-z0-9-]+$/.test(form.order_no)) errs.order_no = '订单编号只能包含字母、数字和横线'
    if (!form.product_name.trim()) errs.product_name = '请输入产品名称'
    if (!form.quantity || parseInt(form.quantity) <= 0) errs.quantity = '数量必须大于0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const data = { ...form, quantity: parseInt(form.quantity), priority: parseInt(form.priority) }
      if (editingId) {
        await api.put(`/orders/${editingId}`, data)
        showToast('订单更新成功')
      } else {
        await api.post('/orders/', data)
        showToast('订单创建成功')
      }
      closeModal()
      loadOrders()
    } catch (err) {
      if (err.response?.status === 400) setErrors({ order_no: '订单编号已存在' })
    }
  }

  const handleEdit = (order) => {
    setForm({
      order_no: order.order_no,
      product_name: order.product_name,
      style_no: order.style_no || '',
      quantity: order.quantity.toString(),
      customer_name: order.customer_name || '',
      priority: order.priority.toString(),
      status: order.status
    })
    setEditingId(order.id)
    setShowModal(true)
    setErrors({})
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条订单吗？')) return
    await api.delete(`/orders/${id}`)
    showToast('订单删除成功')
    loadOrders()
  }

  const openModal = () => {
    setForm({ order_no: '', product_name: '', style_no: '', quantity: '', customer_name: '', priority: '3', status: 'pending' })
    setEditingId(null)
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setErrors({})
  }

  const statusMap = { pending: '待生产', in_progress: '生产中', completed: '已完成', cancelled: '已取消' }

  return (
    <div className="main-content fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">生产订单</h2>
          <button className="btn btn-primary" onClick={openModal}>+ 新增订单</button>
        </div>
        <div className="card-body">
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">暂无订单数据</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>订单编号</th><th>产品名称</th><th>款号</th><th>数量</th><th>客户</th><th>优先级</th><th>状态</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: '500' }}>{o.order_no}</td>
                      <td>{o.product_name}</td>
                      <td>{o.style_no || '-'}</td>
                      <td>{o.quantity.toLocaleString()}</td>
                      <td>{o.customer_name || '-'}</td>
                      <td>P{o.priority}</td>
                      <td><span className={`badge badge-${o.status}`}>{statusMap[o.status]}</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(o)}>编辑</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(o.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? '编辑订单' : '新增订单'}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">订单编号 *</label>
              <input className={`form-input ${errors.order_no ? 'input-error' : ''}`} value={form.order_no} onChange={e => setForm({...form, order_no: e.target.value})} placeholder="如: PO2024005" disabled={!!editingId} />
              {errors.order_no && <span className="error-text">{errors.order_no}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">产品名称 *</label>
              <input className={`form-input ${errors.product_name ? 'input-error' : ''}`} value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})} placeholder="如: 男士休闲衬衫" />
              {errors.product_name && <span className="error-text">{errors.product_name}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">款号</label>
              <input className="form-input" value={form.style_no} onChange={e => setForm({...form, style_no: e.target.value})} placeholder="如: CS-M-001" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">数量 *</label>
              <input className={`form-input ${errors.quantity ? 'input-error' : ''}`} type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="请输入数量" />
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">客户名称</label>
              <input className="form-input" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="如: 优衣库" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">优先级</label>
              <select className="form-input form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="1">1 - 最高</option>
                <option value="2">2 - 高</option>
                <option value="3">3 - 中</option>
                <option value="4">4 - 低</option>
                <option value="5">5 - 最低</option>
              </select>
            </div>
            {editingId && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">状态</label>
                <select className="form-input form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="pending">待生产</option>
                  <option value="in_progress">生产中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
            <button type="submit" className="btn btn-primary">{editingId ? '更新' : '保存'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// 物料管理
function Materials() {
  const [materials, setMaterials] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', category: 'fabric', unit: '米', stock_quantity: '', price: '', color: '' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => { loadMaterials() }, [])

  const loadMaterials = async () => {
    const res = await api.get('/materials/')
    setMaterials(res.data)
  }

  const validate = () => {
    const errs = {}
    if (!form.code.trim()) errs.code = '请输入物料编码'
    else if (!/^[A-Za-z0-9-]+$/.test(form.code)) errs.code = '编码只能包含字母、数字和横线'
    if (!form.name.trim()) errs.name = '请输入物料名称'
    if (!form.stock_quantity || parseFloat(form.stock_quantity) < 0) errs.stock_quantity = '库存数量不能为负'
    if (form.price && parseFloat(form.price) < 0) errs.price = '单价不能为负'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const data = { ...form, stock_quantity: parseFloat(form.stock_quantity), price: parseFloat(form.price || 0) }
      if (editingId) {
        await api.put(`/materials/${editingId}`, data)
        showToast('物料更新成功')
      } else {
        await api.post('/materials/', data)
        showToast('物料创建成功')
      }
      closeModal()
      loadMaterials()
    } catch (err) {
      if (err.response?.status === 400) setErrors({ code: '物料编码已存在' })
    }
  }

  const handleEdit = (m) => {
    setForm({
      code: m.code,
      name: m.name,
      category: m.category,
      unit: m.unit,
      stock_quantity: m.stock_quantity.toString(),
      price: m.price?.toString() || '',
      color: m.color || ''
    })
    setEditingId(m.id)
    setShowModal(true)
    setErrors({})
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条物料吗？')) return
    await api.delete(`/materials/${id}`)
    showToast('物料删除成功')
    loadMaterials()
  }

  const openModal = () => {
    setForm({ code: '', name: '', category: 'fabric', unit: '米', stock_quantity: '', price: '', color: '' })
    setEditingId(null)
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setErrors({})
  }

  const categoryMap = { fabric: '面料', accessory: '辅料', packaging: '包装材料' }

  return (
    <div className="main-content fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">物料管理</h2>
          <button className="btn btn-primary" onClick={openModal}>+ 新增物料</button>
        </div>
        <div className="card-body">
          {materials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <p className="empty-state-text">暂无物料数据</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>编码</th><th>名称</th><th>类别</th><th>颜色</th><th>库存</th><th>单位</th><th>单价</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {materials.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: '500' }}>{m.code}</td>
                      <td>{m.name}</td>
                      <td>{categoryMap[m.category]}</td>
                      <td>{m.color || '-'}</td>
                      <td style={{ color: m.stock_quantity <= m.min_stock ? 'var(--danger)' : 'inherit' }}>{m.stock_quantity.toLocaleString()}</td>
                      <td>{m.unit}</td>
                      <td>¥{m.price?.toFixed(2) || '0.00'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(m)}>编辑</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(m.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? '编辑物料' : '新增物料'}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">物料编码 *</label>
              <input className={`form-input ${errors.code ? 'input-error' : ''}`} value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="如: MAT007" disabled={!!editingId} />
              {errors.code && <span className="error-text">{errors.code}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">物料名称 *</label>
              <input className={`form-input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="如: 纯棉面料" />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">类别</label>
              <select className="form-input form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="fabric">面料</option>
                <option value="accessory">辅料</option>
                <option value="packaging">包装材料</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">单位</label>
              <input className="form-input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="如: 米、条、颗" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">库存数量 *</label>
              <input className={`form-input ${errors.stock_quantity ? 'input-error' : ''}`} type="number" step="0.01" min="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} placeholder="请输入库存数量" />
              {errors.stock_quantity && <span className="error-text">{errors.stock_quantity}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">单价</label>
              <input className={`form-input ${errors.price ? 'input-error' : ''}`} type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="如: 35.50" />
              {errors.price && <span className="error-text">{errors.price}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">颜色</label>
              <input className="form-input" value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="如: 白色、黑色" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
            <button type="submit" className="btn btn-primary">{editingId ? '更新' : '保存'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// 供应商管理
function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', contact_person: '', phone: '', address: '' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => { loadSuppliers() }, [])

  const loadSuppliers = async () => {
    const res = await api.get('/suppliers/')
    setSuppliers(res.data)
  }

  const validate = () => {
    const errs = {}
    if (!form.code.trim()) errs.code = '请输入供应商编码'
    else if (!/^[A-Za-z0-9-]+$/.test(form.code)) errs.code = '编码只能包含字母、数字和横线'
    if (!form.name.trim()) errs.name = '请输入供应商名称'
    if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) errs.phone = '请输入正确的手机号'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form)
        showToast('供应商更新成功')
      } else {
        await api.post('/suppliers/', form)
        showToast('供应商创建成功')
      }
      closeModal()
      loadSuppliers()
    } catch (err) {
      if (err.response?.status === 400) setErrors({ code: '供应商编码已存在' })
    }
  }

  const handleEdit = (s) => {
    setForm({
      code: s.code,
      name: s.name,
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      address: s.address || ''
    })
    setEditingId(s.id)
    setShowModal(true)
    setErrors({})
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个供应商吗？')) return
    try {
      await api.delete(`/suppliers/${id}`)
      showToast('供应商删除成功')
      loadSuppliers()
    } catch (err) {
      showToast('删除失败，该供应商可能有关联的物料', 'error')
    }
  }

  const openModal = () => {
    setForm({ code: '', name: '', contact_person: '', phone: '', address: '' })
    setEditingId(null)
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setErrors({})
  }

  return (
    <div className="main-content fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">供应商管理</h2>
          <button className="btn btn-primary" onClick={openModal}>+ 新增供应商</button>
        </div>
        <div className="card-body">
          {suppliers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <p className="empty-state-text">暂无供应商数据</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>编码</th><th>名称</th><th>联系人</th><th>电话</th><th>地址</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '500' }}>{s.code}</td>
                      <td>{s.name}</td>
                      <td>{s.contact_person || '-'}</td>
                      <td>{s.phone || '-'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(s)}>编辑</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? '编辑供应商' : '新增供应商'}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">供应商编码 *</label>
              <input className={`form-input ${errors.code ? 'input-error' : ''}`} value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="如: SUP004" disabled={!!editingId} />
              {errors.code && <span className="error-text">{errors.code}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">供应商名称 *</label>
              <input className={`form-input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="如: 杭州丝绸面料厂" />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">联系人</label>
              <input className="form-input" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} placeholder="如: 张经理" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">联系电话</label>
              <input className={`form-input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="如: 13800138000" />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
              <label className="form-label">地址</label>
              <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="如: 浙江省杭州市萧山区" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
            <button type="submit" className="btn btn-primary">{editingId ? '更新' : '保存'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// 生产记录
function Production() {
  const [records, setRecords] = useState([])
  const [orders, setOrders] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ order_id: '', process_name: 'cutting', quantity_completed: '', quantity_defective: '0', work_station: '' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => {
    loadRecords()
    api.get('/orders/').then(res => setOrders(res.data))
  }, [])

  const loadRecords = async () => {
    const res = await api.get('/production/')
    setRecords(res.data)
  }

  const validate = () => {
    const errs = {}
    if (!form.order_id) errs.order_id = '请选择关联订单'
    if (!form.quantity_completed || parseInt(form.quantity_completed) <= 0) errs.quantity_completed = '完成数量必须大于0'
    if (form.quantity_defective && parseInt(form.quantity_defective) < 0) errs.quantity_defective = '不良品数量不能为负'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = {
      ...form,
      order_id: parseInt(form.order_id),
      quantity_completed: parseInt(form.quantity_completed),
      quantity_defective: parseInt(form.quantity_defective)
    }
    if (editingId) {
      await api.put(`/production/${editingId}`, data)
      showToast('生产记录更新成功')
    } else {
      await api.post('/production/', data)
      showToast('生产记录创建成功')
    }
    closeModal()
    loadRecords()
  }

  const handleEdit = (r) => {
    setForm({
      order_id: r.order_id.toString(),
      process_name: r.process_name,
      quantity_completed: r.quantity_completed.toString(),
      quantity_defective: r.quantity_defective.toString(),
      work_station: r.work_station || ''
    })
    setEditingId(r.id)
    setShowModal(true)
    setErrors({})
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条生产记录吗？')) return
    await api.delete(`/production/${id}`)
    showToast('生产记录删除成功')
    loadRecords()
  }

  const openModal = () => {
    setForm({ order_id: '', process_name: 'cutting', quantity_completed: '', quantity_defective: '0', work_station: '' })
    setEditingId(null)
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setErrors({})
  }

  const processMap = { cutting: '裁剪', sewing: '缝制', ironing: '熨烫', packaging: '包装', quality_check: '质检' }

  return (
    <div className="main-content fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">生产记录</h2>
          <button className="btn btn-primary" onClick={openModal}>+ 新增记录</button>
        </div>
        <div className="card-body">
          {records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚙️</div>
              <p className="empty-state-text">暂无生产记录</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>订单ID</th><th>工序</th><th>完成数量</th><th>不良品</th><th>良品率</th><th>工位</th><th>记录时间</th><th>操作</th></tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const total = r.quantity_completed + r.quantity_defective
                    const rate = total > 0 ? ((r.quantity_completed / total) * 100).toFixed(1) : '100.0'
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '500' }}>#{r.order_id}</td>
                        <td>{processMap[r.process_name]}</td>
                        <td>{r.quantity_completed.toLocaleString()}</td>
                        <td style={{ color: r.quantity_defective > 0 ? 'var(--danger)' : 'inherit' }}>{r.quantity_defective}</td>
                        <td style={{ color: parseFloat(rate) >= 98 ? 'var(--success)' : parseFloat(rate) >= 95 ? 'var(--warning)' : 'var(--danger)' }}>{rate}%</td>
                        <td>{r.work_station || '-'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>编辑</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r.id)}>删除</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? '编辑生产记录' : '新增生产记录'}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">关联订单 *</label>
              <select className={`form-input form-select ${errors.order_id ? 'input-error' : ''}`} value={form.order_id} onChange={e => setForm({...form, order_id: e.target.value})} disabled={!!editingId}>
                <option value="">请选择订单</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} - {o.product_name}</option>)}
              </select>
              {errors.order_id && <span className="error-text">{errors.order_id}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">工序</label>
              <select className="form-input form-select" value={form.process_name} onChange={e => setForm({...form, process_name: e.target.value})}>
                <option value="cutting">裁剪</option>
                <option value="sewing">缝制</option>
                <option value="ironing">熨烫</option>
                <option value="packaging">包装</option>
                <option value="quality_check">质检</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">完成数量 *</label>
              <input className={`form-input ${errors.quantity_completed ? 'input-error' : ''}`} type="number" min="1" value={form.quantity_completed} onChange={e => setForm({...form, quantity_completed: e.target.value})} placeholder="请输入完成数量" />
              {errors.quantity_completed && <span className="error-text">{errors.quantity_completed}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">不良品数量</label>
              <input className={`form-input ${errors.quantity_defective ? 'input-error' : ''}`} type="number" min="0" value={form.quantity_defective} onChange={e => setForm({...form, quantity_defective: e.target.value})} placeholder="默认为0" />
              {errors.quantity_defective && <span className="error-text">{errors.quantity_defective}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">工位</label>
              <input className="form-input" value={form.work_station} onChange={e => setForm({...form, work_station: e.target.value})} placeholder="如: 裁剪车间A" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
            <button type="submit" className="btn btn-primary">{editingId ? '更新' : '保存'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// 路由守卫
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? <div className="app-container"><Sidebar />{children}</div> : <Navigate to="/login" />
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/materials" element={<PrivateRoute><Materials /></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
          <Route path="/production" element={<PrivateRoute><Production /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
