import { useState, useEffect } from 'react'
import api from '../api'
import { useToast } from '../components/Toast'
import Pagination from '../components/Pagination'

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { showToast } = useToast()

  const fetchAlerts = () => {
    setLoading(true)
    api.get('/materials/alerts')
      .then(res => setAlerts(res.data))
      .catch(err => showToast(err.friendlyMessage || '加载预警数据失败', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const filteredAlerts = alerts.filter(alert =>
    alert.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">库存预警</h1>
          <p className="page-subtitle">当前库存低于最低阈值的物料</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="按物料名搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <div className="table-loading">
            <div className="spinner" />
            <span>加载中...</span>
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>物料名称</th>
                  <th>当前库存</th>
                  <th>最低阈值</th>
                  <th>缺口数量</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.name}</td>
                    <td>{alert.stock_quantity}</td>
                    <td>{alert.min_stock}</td>
                    <td>
                      <span className="gap-quantity">{alert.gap}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : searchTerm ? (
          <div className="empty-state">
            <span>🔍</span>
            <p>未找到匹配的预警物料</p>
          </div>
        ) : (
          <div className="empty-state">
            <span>✅</span>
            <p>暂无库存预警，所有物料库存充足！</p>
          </div>
        )}
      </div>
    </div>
  )
}
