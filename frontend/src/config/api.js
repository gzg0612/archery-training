// API基础配置
export const API_CONFIG = {
  // API基础URL
  BASE_URL: process.env.VUE_APP_API_URL || 'http://localhost:8080/api',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 响应成功的状态码
  SUCCESS_CODE: 0,
  
  // 需要刷新token的状态码
  REFRESH_TOKEN_CODE: 401,
  
  // 文件上传地址
  UPLOAD_URL: '/upload',
  
  // WebSocket地址
  WS_URL: process.env.VUE_APP_WS_URL || 'ws://localhost:8080/ws'
}; 