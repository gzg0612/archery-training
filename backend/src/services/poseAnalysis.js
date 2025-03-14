const tf = require('@tensorflow/tfjs-node');
const mediapipe = require('@mediapipe/pose');
const { createCanvas, loadImage } = require('canvas');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class PoseAnalysisService {
  constructor() {
    this.pose = new mediapipe.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    // 配置MediaPipe Pose
    this.pose.setOptions({
      modelComplexity: 2,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    // 理想姿势的关键点角度
    this.idealAngles = {
      shoulder: 90, // 肩部角度
      elbow: 90,   // 肘部角度
      wrist: 180,  // 手腕角度
      spine: 180,  // 脊柱角度
      knee: 175    // 膝盖角度
    };
  }

  // 计算两点之间的角度
  calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - 
                   Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  // 分析姿态稳定性
  analyzeStability(poses) {
    const stabilityScores = poses.map(pose => {
      const shoulders = pose.keypoints.filter(kp => 
        kp.name.includes('SHOULDER')
      );
      const hips = pose.keypoints.filter(kp => 
        kp.name.includes('HIP')
      );

      // 计算肩部和臀部的位移
      const shoulderMovement = this.calculateMovement(shoulders);
      const hipMovement = this.calculateMovement(hips);

      // 根据位移计算稳定性得分
      return 100 - (shoulderMovement + hipMovement) / 2;
    });

    return Math.round(
      stabilityScores.reduce((a, b) => a + b, 0) / stabilityScores.length
    );
  }

  // 分析拉弓一致性
  analyzeDrawConsistency(poses) {
    const drawScores = poses.map(pose => {
      const rightShoulder = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_SHOULDER'
      );
      const rightElbow = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_ELBOW'
      );
      const rightWrist = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_WRIST'
      );

      const drawAngle = this.calculateAngle(
        rightShoulder,
        rightElbow,
        rightWrist
      );

      // 计算与理想角度的差异
      const angleDiff = Math.abs(drawAngle - this.idealAngles.elbow);
      return 100 - (angleDiff / 90) * 100;
    });

    return Math.round(
      drawScores.reduce((a, b) => a + b, 0) / drawScores.length
    );
  }

  // 分析瞄准精度
  analyzeAimingAccuracy(poses) {
    const aimScores = poses.map(pose => {
      const leftEye = pose.keypoints.find(kp => 
        kp.name === 'LEFT_EYE'
      );
      const rightEye = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_EYE'
      );
      const rightWrist = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_WRIST'
      );

      // 计算瞄准线与水平线的角度
      const aimingAngle = this.calculateAngle(
        {x: leftEye.x, y: leftEye.y},
        {x: rightEye.x, y: rightEye.y},
        {x: rightWrist.x, y: rightWrist.y}
      );

      // 理想瞄准角度为0度（水平）
      const angleDiff = Math.abs(aimingAngle);
      return 100 - (angleDiff / 45) * 100;
    });

    return Math.round(
      aimScores.reduce((a, b) => a + b, 0) / aimScores.length
    );
  }

  // 分析释放控制
  analyzeReleaseControl(poses) {
    const releaseScores = poses.map(pose => {
      const rightShoulder = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_SHOULDER'
      );
      const rightElbow = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_ELBOW'
      );
      const rightWrist = pose.keypoints.find(kp => 
        kp.name === 'RIGHT_WRIST'
      );

      // 计算手腕的稳定性
      const wristMovement = this.calculateMovement([rightWrist]);
      const elbowMovement = this.calculateMovement([rightElbow]);

      // 计算释放时的姿势控制得分
      return 100 - ((wristMovement + elbowMovement) / 2);
    });

    return Math.round(
      releaseScores.reduce((a, b) => a + b, 0) / releaseScores.length
    );
  }

  // 计算关键点的移动量
  calculateMovement(points) {
    if (points.length < 2) return 0;
    
    let totalMovement = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      totalMovement += Math.sqrt(dx*dx + dy*dy);
    }
    
    return totalMovement / (points.length - 1);
  }

  // 生成改进建议
  generateSuggestions(scores) {
    const suggestions = [];

    if (scores.stability < 85) {
      suggestions.push({
        type: 'warning',
        title: '站姿稳定性',
        description: '建议加强核心力量训练，保持重心稳定。尝试单腿站立练习来提升平衡能力。'
      });
    } else {
      suggestions.push({
        type: 'success',
        title: '站姿稳定性',
        description: '您的站姿非常稳定，请继续保持。'
      });
    }

    if (scores.drawConsistency < 80) {
      suggestions.push({
        type: 'warning',
        title: '拉弓一致性',
        description: '拉弓动作不够一致，建议使用橡皮筋进行干拉练习，培养肌肉记忆。'
      });
    }

    if (scores.aimingAccuracy < 90) {
      suggestions.push({
        type: 'warning',
        title: '瞄准精度',
        description: '瞄准线不够水平，建议加强瞄准练习，可以使用激光瞄准器辅助训练。'
      });
    }

    if (scores.releaseControl < 85) {
      suggestions.push({
        type: 'warning',
        title: '释放控制',
        description: '释放不够平稳，建议练习缓慢释放，保持手臂稳定性。'
      });
    }

    return suggestions;
  }

  // 分析图片中的姿态
  async analyzePose(imagePath) {
    try {
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const poses = await this.pose.send({
        image: canvas
      });

      if (!poses || poses.length === 0) {
        throw new AppError('未检测到姿态', 400);
      }

      const scores = {
        stability: this.analyzeStability(poses),
        drawConsistency: this.analyzeDrawConsistency(poses),
        aimingAccuracy: this.analyzeAimingAccuracy(poses),
        releaseControl: this.analyzeReleaseControl(poses)
      };

      const suggestions = this.generateSuggestions(scores);

      return {
        scores,
        suggestions,
        keypoints: poses[0].keypoints
      };
    } catch (error) {
      logger.error('姿态分析失败:', error);
      throw new AppError('姿态分析失败', 500);
    }
  }

  // 比较当前姿态与理想姿态
  async compareWithIdeal(currentPose, idealPose) {
    const current = await this.analyzePose(currentPose);
    const ideal = await this.analyzePose(idealPose);

    const comparisons = [];
    const angles = ['shoulder', 'elbow', 'wrist', 'spine', 'knee'];

    for (const angle of angles) {
      const currentAngle = this.calculateAngleFromKeypoints(
        current.keypoints,
        angle
      );
      const idealAngle = this.calculateAngleFromKeypoints(
        ideal.keypoints,
        angle
      );

      comparisons.push({
        label: this.getAngleLabel(angle),
        difference: Math.round(currentAngle - idealAngle),
        current: currentAngle,
        ideal: idealAngle
      });
    }

    return comparisons;
  }

  // 从关键点计算特定角度
  calculateAngleFromKeypoints(keypoints, angleType) {
    switch (angleType) {
      case 'shoulder':
        return this.calculateShoulderAngle(keypoints);
      case 'elbow':
        return this.calculateElbowAngle(keypoints);
      case 'wrist':
        return this.calculateWristAngle(keypoints);
      case 'spine':
        return this.calculateSpineAngle(keypoints);
      case 'knee':
        return this.calculateKneeAngle(keypoints);
      default:
        return 0;
    }
  }

  // 获取角度的中文标签
  getAngleLabel(angleType) {
    const labels = {
      shoulder: '肩部角度',
      elbow: '肘部角度',
      wrist: '手腕角度',
      spine: '脊柱角度',
      knee: '膝盖角度'
    };
    return labels[angleType] || angleType;
  }
}

module.exports = new PoseAnalysisService(); 