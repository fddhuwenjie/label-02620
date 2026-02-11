import { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

export default function Production() {
  const [records, setRecords] = useState([])
  const [orders, setOrders] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ order_id: '', process_name: 'cutting', quantity_completed: '', quantity_defective: '0', work_station: '' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => {
    loadRecords()
    api.get('/orders/').then(res => setOrders(res.data)).catch(err => console.error('加载订单列表失败:', err.friendlyMessage))
  }, [])

  const loadRecords = async () => {
    try {
      const res = await api.get('/production/')
      setRecords(res.data)
    } catch (err) {
      showToast(err.friendlyMessage || '加载生产记录失败', 'error')
    }
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
    try {
      const data = { ...form, order_id: parseInt(form.order_id), quantity_completed: parseInt(form.quantity_completed), quantity_defective: parseInt(form.quantity_defective) }
      if (editingId) { await api.put(`/production/${editingId}`, data); showToast('生产记录更新成功') }
      else { await api.post('/production/', data); showToast('生产记录创建成功') }
      closeModal(); loadRecords()
    } catch (err) { showToast(err.friendlyMessage || '操作失败', 'error') }
  }

  const handleEdit = (r) => {
    setForm({ order_id: r.order_id.toString(), process_name: r.process_name, quantity_completed: r.quantity_completed.toString(), quantity_defective: r.quantity_defective.toString(), work_station: r.work_station || '' })
    setEditingId(r.id); setShowModal(true); setErrors({})
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条生产记录吗？')) return
    try { await api.delete(`/production/${id}`); showToast('生产记录删除成功'); loadRecords() }
    catch (err) { showToast(err.friendlyMessage || '删除失败', 'error') }
  }

  const openModal = () => { setForm({ order_id: '', process_name: 'cutting', quantity_completed: '', quantity_defective: '0', work_station: '' }); setEditingId(null); setErrors({}); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditingId(null); setErrors({}) }
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
            <div className="empty-state"><div className="empty-state-icon">⚙️</div><p className="empty-state-text">暂无生产记录</p></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>订单ID</th><th>工序</th><th>完成数量</th><th>不良品</th><th>良品率</th><th>工位</th><th>记录时间</th><th>操作</th></tr></thead>
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
                        <td><div className="action-buttons"><button className="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>编辑</button><button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r.id)}>删除</button></div></td>
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
                <option value="cutting">裁剪</option><option value="sewing">缝制</option><option value="ironing">熨烫</option><option value="packaging">包装</option><option value="quality_check">质检</option>
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
