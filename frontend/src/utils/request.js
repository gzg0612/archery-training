import axios from 'axios';
import { API_CONFIG } from '../config/api';
import router from '../router';
import { ElMessage } from 'element-plus';

// 创建axios实例
const request = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 如果状态码不是成功状态码，抛出错误
    if (res.code !== API_CONFIG.SUCCESS_CODE) {
      ElMessage.error(res.message || '请求失败');
      
      // 如果是需要刷新token的状态码
      if (res.code === API_CONFIG.REFRESH_TOKEN_CODE) {
        // 清除token并跳转到登录页
        localStorage.removeItem('token');
        router.push('/login');
      }
      
      return Promise.reject(res);
    }
    
    return res;
  },
  error => {
    console.error('请求错误:', error);
    ElMessage.error(error.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request; 