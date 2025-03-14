const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// 用户注册
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('该邮箱已被注册', 400);
    }

    // 创建新用户
    const user = await User.create({
      name,
      email,
      password
    });

    // 生成令牌
    const token = generateToken(user._id);

    // 移除密码
    user.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 检查邮箱和密码是否提供
    if (!email || !password) {
      throw new AppError('请提供邮箱和密码', 400);
    }

    // 查找用户并包含密码字段
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('邮箱或密码错误', 401);
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('邮箱或密码错误', 401);
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken(user._id);

    // 移除密码
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户信息
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
exports.updateMe = async (req, res, next) => {
  try {
    // 不允许更新密码
    if (req.body.password) {
      throw new AppError('此路由不能用于更新密码', 400);
    }

    // 过滤允许更新的字段
    const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'bio', 'settings');

    // 更新用户信息
    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// 更新密码
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 获取用户（包含密码字段）
    const user = await User.findById(req.user._id).select('+password');

    // 验证当前密码
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('当前密码错误', 401);
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 生成新令牌
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      message: '密码已更新'
    });
  } catch (error) {
    next(error);
  }
};

// 删除用户账户
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// 工具函数：过滤对象属性
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}; 