import { createContext, useContext, useState, useCallback } from 'react'

const ConfirmContext = createContext()

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ isOpen: false, message: '', resolve: null })

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, message, resolve })
    })
  }, [])

  const handleConfirm = () => {
    state.resolve(true)
    setState({ isOpen: false, message: '', resolve: null })
  }

  const handleCancel = () => {
    state.resolve(false)
    setState({ isOpen: false, message: '', resolve: null })
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.isOpen && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <div className="confirm-icon">⚠️</div>
            <p className="confirm-message">{state.message}</p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={handleCancel}>取消</button>
              <button className="btn btn-danger" onClick={handleConfirm}>确定删除</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
