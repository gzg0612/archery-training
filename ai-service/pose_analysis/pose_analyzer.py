import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from pathlib import Path
import tempfile
import os

class PoseAnalyzer:
    def __init__(self):
        # 初始化MediaPipe姿态检测
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        # 加载TensorFlow模型
        self.model = self._load_model()
        
        # 理想姿势的关键点角度
        self.ideal_angles = {
            'shoulder': 90,  # 肩部角度
            'elbow': 90,    # 肘部角度
            'wrist': 180,   # 手腕角度
            'spine': 180,   # 脊柱角度
            'knee': 175     # 膝盖角度
        }

    def _load_model(self):
        """加载预训练模型"""
        model_path = Path(__file__).parent / 'models' / 'archery_pose_model.h5'
        if model_path.exists():
            return tf.keras.models.load_model(str(model_path))
        return None

    def is_ready(self):
        """检查服务是否准备就绪"""
        return self.model is not None

    def analyze_video(self, video_file, params):
        """分析视频文件"""
        # 保存上传的视频文件
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
            video_file.save(temp_video.name)
            video_path = temp_video.name

        try:
            # 打开视频文件
            cap = cv2.VideoCapture(video_path)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            
            # 提取关键帧
            frames = []
            frame_interval = fps // params['frame_rate']
            
            results = {
                'posture_scores': [],
                'keyframes': [],
                'analysis': {
                    'stability': 0,
                    'consistency': 0,
                    'accuracy': 0
                },
                'recommendations': []
            }
            
            frame_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                if frame_idx % frame_interval == 0:
                    # 分析帧
                    frame_result = self.analyze_frame(frame)
                    results['posture_scores'].append(frame_result['scores'])
                    
                    if params['save_keyframes'] and len(results['keyframes']) < 5:
                        # 保存关键帧
                        keyframe_path = f'keyframe_{len(results["keyframes"])}.jpg'
                        cv2.imwrite(keyframe_path, frame)
                        results['keyframes'].append({
                            'path': keyframe_path,
                            'timestamp': frame_idx / fps,
                            'scores': frame_result['scores']
                        })
                
                frame_idx += 1
            
            # 计算总体分析结果
            results['analysis'] = self._calculate_overall_analysis(results['posture_scores'])
            results['recommendations'] = self._generate_recommendations(results['analysis'])
            
            return results
            
        finally:
            # 清理临时文件
            os.unlink(video_path)
            cap.release()

    def analyze_frame(self, frame):
        """分析单帧图像"""
        if isinstance(frame, (str, Path)):
            frame = cv2.imread(str(frame))
        
        # 转换颜色空间
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 检测姿态
        pose_results = self.pose.process(frame_rgb)
        
        if pose_results.pose_landmarks is None:
            raise ValueError('未检测到姿态')
        
        # 提取关键点
        landmarks = pose_results.pose_landmarks.landmark
        
        # 计算关键角度
        angles = self._calculate_angles(landmarks)
        
        # 评估姿势
        scores = self._evaluate_pose(angles)
        
        # 生成建议
        suggestions = self._generate_pose_suggestions(scores)
        
        return {
            'scores': scores,
            'angles': angles,
            'suggestions': suggestions
        }

    def _calculate_angles(self, landmarks):
        """计算关键点之间的角度"""
        def calculate_angle(a, b, c):
            a = np.array([a.x, a.y])
            b = np.array([b.x, b.y])
            c = np.array([c.x, c.y])
            
            radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
            angle = np.abs(radians * 180.0 / np.pi)
            
            if angle > 180.0:
                angle = 360 - angle
                
            return angle

        # 计算肩部角度
        shoulder_angle = calculate_angle(
            landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value],
            landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value],
            landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        )

        # 计算肘部角度
        elbow_angle = calculate_angle(
            landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value],
            landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value],
            landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value]
        )

        # 计算手腕角度
        wrist_angle = calculate_angle(
            landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value],
            landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value],
            landmarks[self.mp_pose.PoseLandmark.LEFT_INDEX.value]
        )

        return {
            'shoulder': shoulder_angle,
            'elbow': elbow_angle,
            'wrist': wrist_angle
        }

    def _evaluate_pose(self, angles):
        """评估姿势质量"""
        scores = {}
        
        # 计算每个角度与理想角度的差异
        for joint, angle in angles.items():
            ideal = self.ideal_angles.get(joint)
            if ideal is not None:
                diff = abs(angle - ideal)
                score = max(0, 100 - (diff * 2))  # 每偏差1度扣2分
                scores[joint] = score
        
        # 计算总体稳定性分数
        stability = sum(scores.values()) / len(scores)
        
        return {
            'joint_scores': scores,
            'stability': stability
        }

    def _calculate_overall_analysis(self, frame_scores):
        """计算视频的总体分析结果"""
        # 计算稳定性（帧间分数的一致性）
        stabilities = [score['stability'] for score in frame_scores]
        mean_stability = np.mean(stabilities)
        std_stability = np.std(stabilities)
        
        # 计算一致性（动作的重复性）
        consistency = 100 - (std_stability * 10)  # 标准差越小，一致性越高
        
        # 计算准确性（与理想姿势的接近程度）
        accuracies = []
        for score in frame_scores:
            joint_scores = score['joint_scores']
            accuracy = sum(joint_scores.values()) / len(joint_scores)
            accuracies.append(accuracy)
        
        mean_accuracy = np.mean(accuracies)
        
        return {
            'stability': mean_stability,
            'consistency': consistency,
            'accuracy': mean_accuracy
        }

    def _generate_recommendations(self, analysis):
        """生成改进建议"""
        recommendations = []
        
        if analysis['stability'] < 85:
            recommendations.append({
                'type': 'warning',
                'title': '姿势稳定性',
                'description': '建议加强核心力量训练，保持重心稳定。可以尝试单腿站立练习来提升平衡能力。'
            })
        
        if analysis['consistency'] < 80:
            recommendations.append({
                'type': 'warning',
                'title': '动作一致性',
                'description': '动作重复性不够，建议增加基础动作练习，培养肌肉记忆。'
            })
        
        if analysis['accuracy'] < 90:
            recommendations.append({
                'type': 'warning',
                'title': '姿势准确性',
                'description': '与标准姿势有一定差距，建议对照标准姿势视频进行练习。'
            })
        
        return recommendations

    def _generate_pose_suggestions(self, scores):
        """生成单帧姿势的改进建议"""
        suggestions = []
        
        for joint, score in scores['joint_scores'].items():
            if score < 80:
                suggestions.append({
                    'type': 'warning',
                    'joint': joint,
                    'score': score,
                    'description': f'{joint}角度需要调整，当前与理想角度差距较大。'
                })
        
        return suggestions 