const Training = require('../models/Training');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

// 创建训练记录
exports.createTraining = async (req, res, next) => {
  try {
    const training = await Training.create({
      ...req.body,
      user: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        training
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取训练记录列表
exports.getTrainings = async (req, res, next) => {
  try {
    const { type, startDate, endDate, status } = req.query;
    const query = { user: req.user._id };

    // 添加过滤条件
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const trainings = await Training.find(query)
      .sort('-date')
      .limit(parseInt(req.query.limit) || 10)
      .skip(parseInt(req.query.skip) || 0);

    const total = await Training.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: trainings.length,
      total,
      data: {
        trainings
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个训练记录
exports.getTraining = async (req, res, next) => {
  try {
    const training = await Training.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!training) {
      throw new AppError('未找到该训练记录', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        training
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新训练记录
exports.updateTraining = async (req, res, next) => {
  try {
    const training = await Training.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!training) {
      throw new AppError('未找到该训练记录', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        training
      }
    });
  } catch (error) {
    next(error);
  }
};

// 删除训练记录
exports.deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!training) {
      throw new AppError('未找到该训练记录', 404);
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// 上传训练视频
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('请上传视频文件', 400);
    }

    const training = await Training.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      {
        'video.url': req.file.path,
        'video.thumbnail': req.file.path.replace('.mp4', '-thumb.jpg'),
        'video.duration': req.body.duration
      },
      {
        new: true
      }
    );

    if (!training) {
      throw new AppError('未找到该训练记录', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        training
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取训练统计
exports.getTrainingStats = async (req, res, next) => {
  try {
    const timeRange = req.query.range || 'month';
    const stats = await Training.getUserStats(req.user._id, timeRange);
    const trend = await Training.getTrainingTrend(req.user._id, timeRange);

    res.status(200).json({
      status: 'success',
      data: {
        stats: stats[0] || {
          totalTrainings: 0,
          totalHours: 0,
          averageScore: 0,
          bestScore: 0,
          improvementRate: 0
        },
        trend
      }
    });
  } catch (error) {
    next(error);
  }
};

// 分析训练视频
exports.analyzeVideo = async (req, res, next) => {
  try {
    const training = await Training.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!training) {
      throw new AppError('未找到该训练记录', 404);
    }

    if (!training.video.url) {
      throw new AppError('该训练记录没有视频', 400);
    }

    // TODO: 调用视频分析服务
    // 这里应该调用专门的服务来分析视频并生成分析结果
    const analysis = {
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
          current: 'current-shoulder.jpg',
          ideal: 'ideal-shoulder.jpg'
        }
      ]
    };

    training.analysis = analysis;
    await training.save();

    res.status(200).json({
      status: 'success',
      data: {
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
}; 