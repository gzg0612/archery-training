import request from '../utils/request';
import ws from '../utils/websocket';

// 训练相关的API服务
export const trainingApi = {
  // 创建训练记录
  createTraining: (data) => {
    return request.post('/trainings', data);
  },

  // 获取训练记录列表
  getTrainings: (params) => {
    return request.get('/trainings', { params });
  },

  // 获取单个训练记录
  getTraining: (id) => {
    return request.get(`/trainings/${id}`);
  },

  // 更新训练记录
  updateTraining: (id, data) => {
    return request.put(`/trainings/${id}`, data);
  },

  // 删除训练记录
  deleteTraining: (id) => {
    return request.delete(`/trainings/${id}`);
  },

  // 上传训练视频
  uploadVideo: (id, file, onProgress) => {
    const formData = new FormData();
    formData.append('video', file);

    return request.post(`/trainings/${id}/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      }
    });
  },

  // 开始实时分析
  startAnalysis: (id) => {
    ws.send('start_analysis', { trainingId: id });
  },

  // 停止实时分析
  stopAnalysis: (id) => {
    ws.send('stop_analysis', { trainingId: id });
  },

  // 获取分析结果
  getAnalysisResult: (id) => {
    return request.get(`/trainings/${id}/analysis`);
  },

  // 获取训练统计
  getTrainingStats: (timeRange = 'month') => {
    return request.get('/trainings/stats', {
      params: { range: timeRange }
    });
  },

  // 注册实时分析结果处理器
  onAnalysisResult: (handler) => {
    ws.on('analysis_result', handler);
  },

  // 移除实时分析结果处理器
  offAnalysisResult: () => {
    ws.off('analysis_result');
  }
}; 