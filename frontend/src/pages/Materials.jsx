import { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

export default function Materials() {
  const [materials, setMaterials] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', category: 'fabric', unit: '米', stock_quantity: '', price: '', color: '' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => { loadMaterials() }, [])

  const loadMaterials = async () => {
    try {
      const res = await api.get('/materials/')
      setMaterials(res.data)
    } catch (err) {
      showToast(err.friendlyMessage || '加载物料失败', 'error')
    }
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
      else showToast(err.friendlyMessage || '操作失败', 'error')
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
    try {
      await api.delete(`/materials/${id}`)
      showToast('物料删除成功')
      loadMaterials()
    } catch (err) {
      showToast(err.friendlyMessage || '删除失败', 'error')
    }
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
