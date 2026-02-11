import axios from 'axios'

// Electron 环境下使用完整 URL，Web 环境使用相对路径
const isElectron = window.electronAPI?.isElectron
const baseURL = isElectron ? 'http://localhost:8620/api' : '/api'

const api = axios.create({
  baseURL,
  timeout: 10000
})

// 错误消息映射
const errorMessages = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有操作权限',
  404: '请求的资源不存在',
  500: '服务器内部错误，请稍后重试',
  502: '服务暂时不可用',
  503: '服务维护中',
  default: '网络请求失败，请检查网络连接'
}

// 请求拦截器 - 添加token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  console.error('[API] 请求配置错误:', error)
  return Promise.reject(error)
})

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const url = error.config?.url || 'unknown'
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN'
    
    // 记录错误日志
    console.error(`[API] ${method} ${url} 失败:`, {
      status,
      message: error.response?.data?.detail || error.message,
      data: error.response?.data
    })
    
    // 登录接口的401不触发跳转，由组件自己处理
    if (status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    // 附加友好错误消息
    error.friendlyMessage = error.response?.data?.detail || errorMessages[status] || errorMessages.default
    
    return Promise.reject(error)
  }
)

export default api
