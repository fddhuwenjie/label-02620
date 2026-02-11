export default function Pagination({ current, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  
  // 始终显示分页信息，即使只有一页
  if (total === 0) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="pagination">
      <button className="pagination-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>‹</button>
      {pages.map((p, i) => p === '...' ? (
        <span key={i} className="pagination-ellipsis">...</span>
      ) : (
        <button key={i} className={`pagination-btn ${current === p ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button className="pagination-btn" disabled={current === totalPages} onClick={() => onChange(current + 1)}>›</button>
      <span className="pagination-info">共 {total} 条</span>
    </div>
  )
}
