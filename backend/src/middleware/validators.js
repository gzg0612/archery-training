const { body, param, query, validationResult } = require('express-validator');

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }
  next();
};

// 用户相关验证
const userValidators = {
  register: [
    body('name').trim().notEmpty().withMessage('姓名不能为空'),
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码长度不能少于6位')
      .matches(/\d/)
      .withMessage('密码必须包含数字')
      .matches(/[a-zA-Z]/)
      .withMessage('密码必须包含字母'),
    body('phone').optional().isMobilePhone('zh-CN').withMessage('请输入有效的手机号码'),
    handleValidationErrors
  ],

  login: [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('密码不能为空'),
    handleValidationErrors
  ],

  updateProfile: [
    body('name').optional().trim().notEmpty().withMessage('姓名不能为空'),
    body('phone').optional().isMobilePhone('zh-CN').withMessage('请输入有效的手机号码'),
    body('bio').optional().isLength({ max: 500 }).withMessage('个人简介不能超过500字'),
    handleValidationErrors
  ],

  updatePassword: [
    body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密码长度不能少于6位')
      .matches(/\d/)
      .withMessage('新密码必须包含数字')
      .matches(/[a-zA-Z]/)
      .withMessage('新密码必须包含字母'),
    handleValidationErrors
  ]
};

// 训练相关验证
const trainingValidators = {
  create: [
    body('type')
      .isIn(['技术训练', '力量训练', '比赛模拟', '其他'])
      .withMessage('无效的训练类型'),
    body('date').isISO8601().withMessage('无效的日期格式'),
    body('duration')
      .isFloat({ min: 0.5, max: 8 })
      .withMessage('训练时长必须在0.5到8小时之间'),
    body('score')
      .isInt({ min: 0, max: 100 })
      .withMessage('分数必须在0到100之间'),
    body('comment').optional().isLength({ max: 500 }).withMessage('备注不能超过500字'),
    handleValidationErrors
  ],

  update: [
    param('id').isMongoId().withMessage('无效的训练记录ID'),
    body('type')
      .optional()
      .isIn(['技术训练', '力量训练', '比赛模拟', '其他'])
      .withMessage('无效的训练类型'),
    body('date').optional().isISO8601().withMessage('无效的日期格式'),
    body('duration')
      .optional()
      .isFloat({ min: 0.5, max: 8 })
      .withMessage('训练时长必须在0.5到8小时之间'),
    body('score')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('分数必须在0到100之间'),
    body('comment').optional().isLength({ max: 500 }).withMessage('备注不能超过500字'),
    handleValidationErrors
  ],

  getTrainings: [
    query('type')
      .optional()
      .isIn(['技术训练', '力量训练', '比赛模拟', '其他'])
      .withMessage('无效的训练类型'),
    query('startDate').optional().isISO8601().withMessage('无效的开始日期'),
    query('endDate').optional().isISO8601().withMessage('无效的结束日期'),
    query('status')
      .optional()
      .isIn(['进行中', '已完成', '已取消'])
      .withMessage('无效的状态'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1到100之间'),
    query('skip').optional().isInt({ min: 0 }).withMessage('跳过数量不能为负数'),
    handleValidationErrors
  ],

  getTraining: [
    param('id').isMongoId().withMessage('无效的训练记录ID'),
    handleValidationErrors
  ],

  uploadVideo: [
    param('id').isMongoId().withMessage('无效的训练记录ID'),
    body('duration').isFloat({ min: 0 }).withMessage('视频时长必须大于0'),
    handleValidationErrors
  ],

  analyzeVideo: [
    param('id').isMongoId().withMessage('无效的训练记录ID'),
    handleValidationErrors
  ],

  getStats: [
    query('range')
      .optional()
      .isIn(['week', 'month', 'year'])
      .withMessage('无效的时间范围'),
    handleValidationErrors
  ]
};

module.exports = {
  userValidators,
  trainingValidators
}; 