import { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', contact_person: '', phone: '', address: '' })
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => { loadSuppliers() }, [])

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/suppliers/')
      setSuppliers(res.data)
    } catch (err) {
      showToast(err.friendlyMessage || '加载供应商失败', 'error')
    }
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
      else showToast(err.friendlyMessage || '操作失败', 'error')
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
      if (err.response?.data?.detail?.includes('关联')) {
        showToast('删除失败，该供应商有关联的物料', 'error')
      } else {
        showToast(err.friendlyMessage || '删除失败', 'error')
      }
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
