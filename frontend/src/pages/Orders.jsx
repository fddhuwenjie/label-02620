import { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ order_no: '', product_name: '', style_no: '', quantity: '', customer_name: '', priority: '3', status: 'pending' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()
  const confirm = useConfirm()

  useEffect(() => { loadOrders(currentPage) }, [currentPage])

  const loadOrders = async (page) => {
    try {
      const res = await api.get(`/orders/?page=${page}&page_size=${PAGE_SIZE}`)
      setOrders(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      showToast(err.friendlyMessage || '加载订单失败', 'error')
    }
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
      loadOrders(currentPage)
    } catch (err) {
      if (err.response?.status === 400) setErrors({ order_no: '订单编号已存在' })
      else showToast(err.friendlyMessage || '操作失败', 'error')
    }
  }

  const handleEdit = (order) => {
    setForm({ order_no: order.order_no, product_name: order.product_name, style_no: order.style_no || '', quantity: order.quantity.toString(), customer_name: order.customer_name || '', priority: order.priority.toString(), status: order.status })
    setEditingId(order.id)
    setShowModal(true)
    setErrors({})
  }

  const handleDelete = async (id) => {
    const ok = await confirm('确定要删除这条订单吗？')
    if (!ok) return
    try {
      await api.delete(`/orders/${id}`)
      showToast('订单删除成功')
      loadOrders(currentPage)
    } catch (err) {
      showToast(err.friendlyMessage || '删除失败', 'error')
    }
  }

  const openModal = () => { setForm({ order_no: '', product_name: '', style_no: '', quantity: '', customer_name: '', priority: '3', status: 'pending' }); setEditingId(null); setErrors({}); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditingId(null); setErrors({}) }
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
            <div className="empty-state"><div className="empty-state-icon">📋</div><p className="empty-state-text">暂无订单数据</p></div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>订单编号</th><th>产品名称</th><th>款号</th><th>数量</th><th>客户</th><th>优先级</th><th>状态</th><th>操作</th></tr></thead>
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
              <Pagination current={currentPage} total={total} pageSize={PAGE_SIZE} onChange={setCurrentPage} />
            </>
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
                <option value="1">1 - 最高</option><option value="2">2 - 高</option><option value="3">3 - 中</option><option value="4">4 - 低</option><option value="5">5 - 最低</option>
              </select>
            </div>
            {editingId && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">状态</label>
                <select className="form-input form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="pending">待生产</option><option value="in_progress">生产中</option><option value="completed">已完成</option><option value="cancelled">已取消</option>
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
