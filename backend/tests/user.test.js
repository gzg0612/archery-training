const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const { generateToken } = require('../src/utils/auth');

describe('用户API测试', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    // 连接测试数据库
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    
    // 创建测试用户
    testUser = await User.create({
      name: '测试用户',
      email: 'test@example.com',
      password: 'password123',
      phone: '13800138000'
    });

    testToken = generateToken(testUser);
  });

  afterAll(async () => {
    // 清理测试数据
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/users/register', () => {
    it('应该成功注册新用户', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: '新用户',
          email: 'new@example.com',
          password: 'password123',
          phone: '13800138001'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user).toHaveProperty('token');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('应该验证邮箱格式', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: '新用户',
          email: 'invalid-email',
          password: 'password123',
          phone: '13800138001'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('请输入有效的邮箱地址');
    });

    it('应该验证密码强度', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: '新用户',
          email: 'new@example.com',
          password: 'weak',
          phone: '13800138001'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('密码长度不能少于6位');
    });
  });

  describe('POST /api/users/login', () => {
    it('应该成功登录', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user).toHaveProperty('token');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('应该验证错误的密码', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('邮箱或密码错误');
    });
  });

  describe('GET /api/users/me', () => {
    it('应该获取当前用户信息', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user._id).toBe(testUser._id.toString());
    });

    it('应该验证无效的token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('应该更新用户信息', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: '更新后的名字',
          phone: '13800138002'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('更新后的名字');
      expect(res.body.data.user.phone).toBe('13800138002');
    });

    it('应该验证手机号格式', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          phone: 'invalid-phone'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('请输入有效的手机号码');
    });
  });

  describe('PATCH /api/users/password', () => {
    it('应该更新密码', async () => {
      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('密码更新成功');

      // 验证新密码
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });

      expect(loginRes.status).toBe(200);
    });

    it('应该验证当前密码', async () => {
      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('当前密码错误');
    });
  });
}); 