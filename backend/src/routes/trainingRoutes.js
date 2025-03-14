const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证
router.use(auth.verifyToken);

// 训练记录管理
router
  .route('/')
  .post(trainingController.createTraining)
  .get(trainingController.getTrainings);

router
  .route('/:id')
  .get(trainingController.getTraining)
  .patch(trainingController.updateTraining)
  .delete(trainingController.deleteTraining);

// 视频管理
router
  .route('/:id/video')
  .post(upload.single('video'), trainingController.uploadVideo);

router
  .route('/:id/analyze')
  .post(trainingController.analyzeVideo);

// 统计分析
router
  .route('/stats')
  .get(trainingController.getTrainingStats);

module.exports = router; 