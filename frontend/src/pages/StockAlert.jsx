import { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'

export default function StockAlert() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showThresholdModal, setShowThresholdModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [thresholdValue, setThresholdValue] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/materials/alerts')
      setAlerts(res.data)
    } catch (err) {
      showToast(err.friendlyMessage || '加载预警数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = alerts.filter(alert =>
    alert.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openThresholdModal = (material) => {
    setSelectedMaterial(material)
    setThresholdValue(material.min_stock.toString())
    setShowThresholdModal(true)
  }

  const handleThresholdUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/materials/${selectedMaterial.id}/threshold`, {
        min_stock: parseFloat(thresholdValue)
      })
      showToast('阈值更新成功')
      setShowThresholdModal(false)
      loadAlerts()
    } catch (err) {
      showToast(err.friendlyMessage || '更新阈值失败', 'error')
    }
  }

  return (
    <div className="main-content fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">库存预警</h2>
          <div className="search-box-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="按物料名称搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                width: '250px',
                outline: 'none'
              }}
            />
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <p className="empty-state-text">加载中...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <p className="empty-state-text">所有物料库存充足，暂无预警</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-text">未找到匹配 "{searchTerm}" 的预警物料</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>物料名称</th>
                    <th>当前库存</th>
                    <th>最低阈值</th>
                    <th>缺口数量</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.name}</td>
                      <td>{alert.stock_quantity.toLocaleString()}</td>
                      <td>{alert.min_stock.toLocaleString()}</td>
                      <td>
                        <span style={{ 
                          color: 'var(--danger)', 
                          fontWeight: '600',
                          fontSize: '1.1em'
                        }}>
                          -{alert.gap.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => openThresholdModal(alert)}
                        >
                          设置阈值
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
        isOpen={showThresholdModal} 
        onClose={() => setShowThresholdModal(false)} 
        title="设置库存阈值"
      >
        <form onSubmit={handleThresholdUpdate}>
          <div className="form-group">
            <label className="form-label">物料名称</label>
            <input 
              className="form-input" 
              value={selectedMaterial?.name || ''} 
              disabled
              style={{ background: 'var(--bg-secondary)' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">当前库存</label>
            <input 
              className="form-input" 
              value={selectedMaterial?.stock_quantity || ''} 
              disabled
              style={{ background: 'var(--bg-secondary)' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">最低库存阈值 *</label>
            <input 
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
              placeholder="请输入阈值"
              autoFocus
            />
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowThresholdModal(false)}
            >
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
