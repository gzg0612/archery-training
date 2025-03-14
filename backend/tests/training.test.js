const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const app = require('../src/app');
const User = require('../src/models/User');
const Training = require('../src/models/Training');
const { generateToken } = require('../src/utils/auth');

describe('训练API测试', () => {
  let testUser;
  let testToken;
  let testTraining;

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

    // 创建测试训练记录
    testTraining = await Training.create({
      user: testUser._id,
      type: '技术训练',
      date: new Date(),
      duration: 2,
      score: 85,
      comment: '测试训练记录'
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await User.deleteMany({});
    await Training.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/trainings', () => {
    it('应该成功创建训练记录', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: '力量训练',
          date: new Date().toISOString(),
          duration: 1.5,
          score: 90,
          comment: '新的训练记录'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.training).toHaveProperty('_id');
      expect(res.body.data.training.type).toBe('力量训练');
    });

    it('应该验证训练类型', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: '无效类型',
          date: new Date().toISOString(),
          duration: 1.5,
          score: 90
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('无效的训练类型');
    });

    it('应该验证训练时长', async () => {
      const res = await request(app)
        .post('/api/trainings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          type: '技术训练',
          date: new Date().toISOString(),
          duration: 9,
          score: 90
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('训练时长必须在0.5到8小时之间');
    });
  });

  describe('GET /api/trainings', () => {
    it('应该获取训练记录列表', async () => {
      const res = await request(app)
        .get('/api/trainings')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.trainings)).toBe(true);
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    it('应该支持分页和过滤', async () => {
      const res = await request(app)
        .get('/api/trainings')
        .set('Authorization', `Bearer ${testToken}`)
        .query({
          type: '技术训练',
          limit: 10,
          skip: 0
        });

      expect(res.status).toBe(200);
      expect(res.body.data.trainings.length).toBeLessThanOrEqual(10);
      expect(res.body.data.trainings.every(t => t.type === '技术训练')).toBe(true);
    });
  });

  describe('GET /api/trainings/:id', () => {
    it('应该获取单个训练记录', async () => {
      const res = await request(app)
        .get(`/api/trainings/${testTraining._id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.training._id).toBe(testTraining._id.toString());
    });

    it('应该验证无效的训练记录ID', async () => {
      const res = await request(app)
        .get('/api/trainings/invalid-id')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('无效的训练记录ID');
    });
  });

  describe('PATCH /api/trainings/:id', () => {
    it('应该更新训练记录', async () => {
      const res = await request(app)
        .patch(`/api/trainings/${testTraining._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          score: 95,
          comment: '更新后的训练记录'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.training.score).toBe(95);
      expect(res.body.data.training.comment).toBe('更新后的训练记录');
    });

    it('应该验证分数范围', async () => {
      const res = await request(app)
        .patch(`/api/trainings/${testTraining._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          score: 150
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('分数必须在0到100之间');
    });
  });

  describe('POST /api/trainings/:id/video', () => {
    it('应该上传训练视频', async () => {
      const videoPath = path.join(__dirname, 'fixtures/test-video.mp4');
      const res = await request(app)
        .post(`/api/trainings/${testTraining._id}/video`)
        .set('Authorization', `Bearer ${testToken}`)
        .attach('video', videoPath)
        .field('duration', 120);

      expect(res.status).toBe(200);
      expect(res.body.data.training.video).toHaveProperty('url');
      expect(res.body.data.training.video).toHaveProperty('thumbnail');
      expect(res.body.data.training.video).toHaveProperty('duration');
    });

    it('应该验证视频文件', async () => {
      const textPath = path.join(__dirname, 'fixtures/test.txt');
      const res = await request(app)
        .post(`/api/trainings/${testTraining._id}/video`)
        .set('Authorization', `Bearer ${testToken}`)
        .attach('video', textPath)
        .field('duration', 120);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('只允许上传视频文件');
    });
  });

  describe('POST /api/trainings/:id/analyze', () => {
    it('应该分析训练视频', async () => {
      const res = await request(app)
        .post(`/api/trainings/${testTraining._id}/analyze`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.analysis).toHaveProperty('postureScores');
      expect(res.body.data.analysis).toHaveProperty('improvementSuggestions');
      expect(res.body.data.analysis).toHaveProperty('poseComparisons');
    });

    it('应该处理没有视频的训练记录', async () => {
      const training = await Training.create({
        user: testUser._id,
        type: '技术训练',
        date: new Date(),
        duration: 2,
        score: 85
      });

      const res = await request(app)
        .post(`/api/trainings/${training._id}/analyze`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('该训练记录没有视频');
    });
  });

  describe('GET /api/trainings/stats', () => {
    it('应该获取训练统计', async () => {
      const res = await request(app)
        .get('/api/trainings/stats')
        .set('Authorization', `Bearer ${testToken}`)
        .query({ range: 'month' });

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toHaveProperty('totalTrainings');
      expect(res.body.data.stats).toHaveProperty('totalHours');
      expect(res.body.data.stats).toHaveProperty('averageScore');
      expect(res.body.data).toHaveProperty('trend');
    });

    it('应该验证时间范围', async () => {
      const res = await request(app)
        .get('/api/trainings/stats')
        .set('Authorization', `Bearer ${testToken}`)
        .query({ range: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('无效的时间范围');
    });
  });
}); 