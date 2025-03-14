const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '用户名是必需的'],
    trim: true
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少需要6个字符'],
    select: false
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, '个人简介不能超过500个字符']
  },
  level: {
    type: Number,
    default: 1
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalTrainings: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  improvementRate: {
    type: Number,
    default: 0
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    unlockedAt: Date
  }],
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'zh-CN' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// 更新用户统计信息
userSchema.methods.updateStats = async function(trainingData) {
  this.totalTrainings += 1;
  this.totalHours += trainingData.duration;
  
  // 计算新的平均分
  const newTotal = (this.averageScore * (this.totalTrainings - 1)) + trainingData.score;
  this.averageScore = newTotal / this.totalTrainings;
  
  // 计算进步率
  if (trainingData.previousScore) {
    const improvement = ((trainingData.score - trainingData.previousScore) / trainingData.previousScore) * 100;
    this.improvementRate = (this.improvementRate + improvement) / 2;
  }
  
  await this.save();
};

// 检查成就
userSchema.methods.checkAchievements = async function() {
  const achievements = [
    {
      id: 'perfect_score',
      name: '完美得分',
      description: '单次训练得分达到100分',
      condition: (stats) => stats.score >= 100
    },
    {
      id: 'consistent_training',
      name: '坚持不懈',
      description: '连续30天进行训练',
      condition: (stats) => stats.consecutiveDays >= 30
    },
    {
      id: 'master_archer',
      name: '射箭大师',
      description: '累计训练时长达到1000小时',
      condition: (stats) => stats.totalHours >= 1000
    }
  ];
  
  for (const achievement of achievements) {
    if (!this.achievements.find(a => a.id === achievement.id)) {
      if (achievement.condition(this)) {
        this.achievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          unlockedAt: new Date()
        });
      }
    }
  }
  
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 