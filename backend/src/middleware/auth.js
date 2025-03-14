const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

// 验证JWT令牌
const verifyToken = async (req, res, next) => {
  try {
    // 获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('未提供认证令牌', 401);
    }

    const token = authHeader.split(' ')[1];

    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('用户不存在', 401);
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('无效的认证令牌', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('认证令牌已过期', 401));
    } else {
      next(error);
    }
  }
};

// 检查用户角色
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError('没有权限执行此操作', 403));
    } else {
      next();
    }
  };
};

// 检查资源所有权
const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        throw new AppError('资源不存在', 404);
      }

      if (resource.user.toString() !== req.user._id.toString()) {
        throw new AppError('没有权限访问此资源', 403);
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  verifyToken,
  checkRole,
  checkOwnership
}; 