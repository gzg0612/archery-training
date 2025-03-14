import request from '../utils/request';

// 用户相关的API服务
export const userApi = {
  // 用户注册
  register: (data) => {
    return request.post('/users/register', data);
  },

  // 用户登录
  login: (data) => {
    return request.post('/users/login', data);
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return request.get('/users/me');
  },

  // 更新用户信息
  updateProfile: (data) => {
    return request.put('/users/me', data);
  },

  // 更新密码
  updatePassword: (data) => {
    return request.put('/users/password', data);
  },

  // 上传头像
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 获取用户统计信息
  getUserStats: () => {
    return request.get('/users/stats');
  },

  // 获取用户成就列表
  getAchievements: () => {
    return request.get('/users/achievements');
  },

  // 退出登录
  logout: () => {
    return request.post('/users/logout');
  }
}; 