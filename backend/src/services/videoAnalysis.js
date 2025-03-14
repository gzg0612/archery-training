const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class VideoAnalysisService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || 'uploads';
    this.tempPath = path.join(this.uploadPath, 'temp');
  }

  // 生成视频缩略图
  async generateThumbnail(videoPath) {
    const thumbnailPath = videoPath.replace('.mp4', '-thumb.jpg');
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['50%'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '320x240'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', (err) => reject(new AppError('生成缩略图失败', 500)));
    });
  }

  // 提取关键帧
  async extractKeyframes(videoPath) {
    const keyframesDir = path.join(path.dirname(videoPath), 'keyframes');
    await fs.mkdir(keyframesDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['25%', '50%', '75%'],
          filename: 'frame-%i.jpg',
          folder: keyframesDir,
          size: '640x480'
        })
        .on('end', () => resolve(keyframesDir))
        .on('error', (err) => reject(new AppError('提取关键帧失败', 500)));
    });
  }

  // 分析姿态
  async analyzePosture(keyframesDir) {
    // TODO: 集成姿态识别模型
    // 这里应该调用专门的人工智能模型来分析姿态
    return {
      postureScores: [
        { label: '站姿稳定性', value: 85 },
        { label: '拉弓一致性', value: 78 },
        { label: '瞄准精度', value: 92 },
        { label: '释放控制', value: 88 }
      ],
      improvementSuggestions: [
        {
          type: 'success',
          title: '站姿稳定',
          description: '您的站姿整体稳定，建议继续保持'
        },
        {
          type: 'warning',
          title: '拉弓动作',
          description: '拉弓过程中存在轻微晃动，建议加强肩部力量训练'
        }
      ],
      poseComparisons: [
        {
          label: '肩部角度',
          difference: -3,
          current: path.join(keyframesDir, 'frame-1.jpg'),
          ideal: path.join(this.uploadPath, 'ideal-poses/shoulder.jpg')
        }
      ]
    };
  }

  // 分析视频
  async analyzeVideo(videoPath) {
    try {
      // 1. 生成缩略图
      const thumbnailPath = await this.generateThumbnail(videoPath);

      // 2. 提取关键帧
      const keyframesDir = await this.extractKeyframes(videoPath);

      // 3. 分析姿态
      const analysis = await this.analyzePosture(keyframesDir);

      // 4. 获取视频时长
      const duration = await this.getVideoDuration(videoPath);

      return {
        thumbnail: thumbnailPath,
        keyframes: await this.getKeyframeFiles(keyframesDir),
        duration,
        analysis
      };
    } catch (error) {
      logger.error('视频分析失败:', error);
      throw new AppError('视频分析失败', 500);
    }
  }

  // 获取视频时长
  async getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(new AppError('获取视频时长失败', 500));
        resolve(metadata.format.duration);
      });
    });
  }

  // 获取关键帧文件列表
  async getKeyframeFiles(keyframesDir) {
    const files = await fs.readdir(keyframesDir);
    return files
      .filter(file => file.startsWith('frame-'))
      .map(file => ({
        path: path.join(keyframesDir, file),
        timestamp: parseInt(file.match(/\d+/)[0]) * 25 // 假设视频总时长为100%
      }));
  }
}

module.exports = new VideoAnalysisService(); 