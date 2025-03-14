const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['技术训练', '力量训练', '比赛模拟', '其他']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // 以小时为单位
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  previousScore: {
    type: Number,
    min: 0,
    max: 100
  },
  improvement: {
    type: Number,
    default: 0
  },
  comment: {
    type: String,
    maxlength: [500, '备注不能超过500个字符']
  },
  video: {
    url: String,
    thumbnail: String,
    duration: Number,
    keyFrames: [{
      time: Number,
      thumbnail: String,
      description: String
    }]
  },
  analysis: {
    postureScores: [{
      label: String,
      value: Number
    }],
    improvementSuggestions: [{
      type: String,
      title: String,
      description: String
    }],
    poseComparisons: [{
      label: String,
      difference: Number,
      current: String,
      ideal: String
    }]
  },
  status: {
    type: String,
    enum: ['进行中', '已完成', '已取消'],
    default: '进行中'
  }
}, {
  timestamps: true
});

// 计算进步率
trainingSchema.pre('save', function(next) {
  if (this.previousScore) {
    this.improvement = ((this.score - this.previousScore) / this.previousScore) * 100;
  }
  next();
});

// 更新用户统计信息
trainingSchema.post('save', async function(doc) {
  try {
    await doc.populate('user');
    await doc.user.updateStats({
      duration: doc.duration,
      score: doc.score,
      previousScore: doc.previousScore
    });
    await doc.user.checkAchievements();
  } catch (error) {
    console.error('更新用户统计信息失败:', error);
  }
});

// 静态方法：获取用户的训练统计
trainingSchema.statics.getUserStats = async function(userId, timeRange) {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalTrainings: { $sum: 1 },
        totalHours: { $sum: '$duration' },
        averageScore: { $avg: '$score' },
        bestScore: { $max: '$score' },
        improvementRate: { $avg: '$improvement' }
      }
    }
  ]);
};

// 静态方法：获取训练趋势
trainingSchema.statics.getTrainingTrend = async function(userId, timeRange) {
  const now = new Date();
  let startDate;
  let groupBy;
  
  switch (timeRange) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      groupBy = { $dateToString: { format: '%Y-%m', date: '$date' } };
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
  }
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        totalHours: { $sum: '$duration' },
        averageScore: { $avg: '$score' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Training = mongoose.model('Training', trainingSchema);

module.exports = Training; 