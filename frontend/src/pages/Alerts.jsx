import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

const categoryMap = {
  fabric: '面料',
  accessory: '辅料',
  packaging: '包装材料'
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [thresholdValue, setThresholdValue] = useState('')
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()

  useEffect(() => {
    loadAlerts()
  }, [searchTerm])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
      const res = await api.get(`/materials/alerts${params}`)
      setAlerts(res.data)
    } catch (err) {
      showToast(err.friendlyMessage || '加载预警数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const openThresholdModal = (material) => {
    setEditingMaterial(material)
    setThresholdValue(material.min_stock.toString())
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMaterial(null)
    setThresholdValue('')
    setErrors({})
  }

  const validateThreshold = () => {
    const errs = {}
    const value = parseFloat(thresholdValue)
    if (isNaN(value) || value < 0) {
      errs.threshold = '阈值必须大于等于0'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleUpdateThreshold = async (e) => {
    e.preventDefault()
    if (!validateThreshold()) return

    try {
      await api.post(`/materials/${editingMaterial.id}/threshold`, {
        min_stock: parseFloat(thresholdValue)
      })
      showToast('阈值更新成功')
      closeModal()
      loadAlerts()
    } catch (err) {
      showToast(err.friendlyMessage || '更新阈值失败', 'error')
    }
  }

  return (
    <div className="main-content fade-in">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">库存预警</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              当前库存低于最低库存阈值的物料列表
            </p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <input
                type="text"
                className="form-input"
                placeholder="搜索物料名称..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ width: '240px' }}
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-skeleton">
              <div className="skeleton-header" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton-card" style={{ height: '48px' }} />
                ))}
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <p className="empty-state-text">
                {searchTerm ? '未找到匹配的预警物料' : '暂无库存预警，所有物料库存充足'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>物料编码</th>
                    <th>物料名称</th>
                    <th>类别</th>
                    <th>当前库存</th>
                    <th>最低阈值</th>
                    <th>缺口数量</th>
                    <th>单位</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '500' }}>{item.code}</td>
                      <td>{item.name}</td>
                      <td>{categoryMap[item.category] || item.category}</td>
                      <td>{item.current_stock.toLocaleString()}</td>
                      <td>{item.min_stock.toLocaleString()}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '600' }}>
                        {item.shortage > 0 ? `+${item.shortage.toLocaleString()}` : item.shortage.toLocaleString()}
                      </td>
                      <td>{item.unit}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openThresholdModal(item)}
                        >
                          调整阈值
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="调整库存阈值"
      >
        <form onSubmit={handleUpdateThreshold}>
          <div className="form-group">
            <label className="form-label">物料</label>
            <input
              className="form-input"
              value={editingMaterial ? `${editingMaterial.code} - ${editingMaterial.name}` : ''}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">最低库存阈值 *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`form-input ${errors.threshold ? 'input-error' : ''}`}
              value={thresholdValue}
              onChange={e => setThresholdValue(e.target.value)}
              placeholder="请输入最低库存阈值"
              autoFocus
            />
            {errors.threshold && <span className="error-text">{errors.threshold}</span>}
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              当库存数量低于此阈值时，将触发库存预警
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
