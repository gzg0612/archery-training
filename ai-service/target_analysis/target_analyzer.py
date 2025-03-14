import cv2
import numpy as np
from pathlib import Path
import torch
from torchvision import transforms
from PIL import Image
import json

class TargetAnalyzer:
    def __init__(self):
        # 加载目标检测模型
        self.model = self._load_model()
        
        # 图像预处理
        self.transform = transforms.Compose([
            transforms.Resize((640, 640)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                              std=[0.229, 0.224, 0.225])
        ])
        
        # 靶型配置
        self.target_configs = self._load_target_configs()

    def _load_model(self):
        """加载预训练的目标检测模型"""
        model_path = Path(__file__).parent / 'models' / 'target_detection_model.pt'
        if model_path.exists():
            model = torch.hub.load('ultralytics/yolov5', 'custom', 
                                 path=str(model_path), force_reload=True)
            model.eval()
            return model
        return None

    def _load_target_configs(self):
        """加载靶型配置"""
        config_path = Path(__file__).parent / 'configs' / 'target_configs.json'
        if config_path.exists():
            with open(config_path, 'r') as f:
                return json.load(f)
        return {}

    def is_ready(self):
        """检查服务是否准备就绪"""
        return self.model is not None

    def analyze_image(self, image_file, params):
        """分析箭靶图片"""
        # 读取图片
        if isinstance(image_file, (str, Path)):
            image = Image.open(image_file)
        else:
            image = Image.open(image_file.stream)
        
        # 获取靶型配置
        target_config = self.target_configs.get(params['target_type'])
        if not target_config:
            raise ValueError(f'不支持的靶型: {params["target_type"]}')
        
        # 检测箭靶和箭矢
        results = self._detect_objects(image)
        
        # 如果没有检测到箭靶
        if not results.pred[0].shape[0]:
            raise ValueError('未检测到箭靶')
        
        # 分析结果
        analysis = self._analyze_results(results, target_config, params)
        
        return analysis

    def analyze_frame(self, frame):
        """分析实时帧"""
        if isinstance(frame, (str, Path)):
            frame = Image.open(frame)
        else:
            frame = Image.open(frame.stream)
        
        # 检测箭靶和箭矢
        results = self._detect_objects(frame)
        
        # 快速分析（仅返回基本信息）
        quick_analysis = self._quick_analyze(results)
        
        return quick_analysis

    def _detect_objects(self, image):
        """检测图像中的箭靶和箭矢"""
        # 预处理图像
        img = self.transform(image).unsqueeze(0)
        
        # 执行检测
        with torch.no_grad():
            results = self.model(img)
        
        return results

    def _analyze_results(self, results, target_config, params):
        """详细分析检测结果"""
        # 提取箭靶和箭矢的位置
        target_box = None
        arrows = []
        
        for *box, conf, cls in results.pred[0]:
            if cls == 0:  # 箭靶
                target_box = box
            elif cls == 1 and params['detect_arrows']:  # 箭矢
                arrows.append(box)
        
        if target_box is None:
            raise ValueError('未检测到箭靶')
        
        # 计算箭矢得分
        scores = []
        for arrow in arrows:
            score = self._calculate_score(arrow, target_box, target_config)
            scores.append(score)
        
        # 分析箭群
        grouping_analysis = self._analyze_grouping(arrows) if arrows else None
        
        # 生成分析结果
        analysis = {
            'target': {
                'type': params['target_type'],
                'distance': params['distance'],
                'box': target_box.tolist()
            },
            'arrows': [
                {
                    'box': arrow.tolist(),
                    'score': score,
                    'ring': self._get_ring(score, target_config)
                }
                for arrow, score in zip(arrows, scores)
            ],
            'total_score': sum(scores),
            'average_score': sum(scores) / len(scores) if scores else 0,
            'grouping': grouping_analysis
        }
        
        # 添加建议
        analysis['recommendations'] = self._generate_recommendations(analysis)
        
        return analysis

    def _quick_analyze(self, results):
        """快速分析（用于实时反馈）"""
        # 提取箭靶和箭矢的位置
        target_detected = False
        arrow_count = 0
        
        for *box, conf, cls in results.pred[0]:
            if cls == 0:  # 箭靶
                target_detected = True
            elif cls == 1:  # 箭矢
                arrow_count += 1
        
        return {
            'target_detected': target_detected,
            'arrow_count': arrow_count
        }

    def _calculate_score(self, arrow, target, config):
        """计算箭矢得分"""
        # 计算箭矢中心点到靶心的距离
        arrow_center = [(arrow[0] + arrow[2]) / 2, (arrow[1] + arrow[3]) / 2]
        target_center = [(target[0] + target[2]) / 2, (target[1] + target[3]) / 2]
        
        distance = np.sqrt(
            (arrow_center[0] - target_center[0]) ** 2 +
            (arrow_center[1] - target_center[1]) ** 2
        )
        
        # 计算靶面半径
        target_radius = min(target[2] - target[0], target[3] - target[1]) / 2
        
        # 归一化距离
        normalized_distance = distance / target_radius
        
        # 根据距离计算得分
        for ring, threshold in config['rings'].items():
            if normalized_distance <= threshold:
                return int(ring)
        
        return 0

    def _get_ring(self, score, config):
        """获取得分对应的环数"""
        for ring, max_score in config['rings'].items():
            if score >= int(ring):
                return int(ring)
        return 0

    def _analyze_grouping(self, arrows):
        """分析箭群"""
        if len(arrows) < 2:
            return None
        
        # 计算箭矢中心点
        centers = np.array([
            [(arrow[0] + arrow[2]) / 2, (arrow[1] + arrow[3]) / 2]
            for arrow in arrows
        ])
        
        # 计算箭群直径（最远两点间距离）
        max_distance = 0
        for i in range(len(centers)):
            for j in range(i + 1, len(centers)):
                distance = np.sqrt(
                    (centers[i][0] - centers[j][0]) ** 2 +
                    (centers[i][1] - centers[j][1]) ** 2
                )
                max_distance = max(max_distance, distance)
        
        # 计算箭群中心
        center = np.mean(centers, axis=0)
        
        # 计算离散度（到中心点的平均距离）
        dispersion = np.mean([
            np.sqrt((x - center[0]) ** 2 + (y - center[1]) ** 2)
            for x, y in centers
        ])
        
        return {
            'diameter': max_distance,
            'dispersion': dispersion,
            'center': center.tolist()
        }

    def _generate_recommendations(self, analysis):
        """生成改进建议"""
        recommendations = []
        
        # 分析得分
        avg_score = analysis['average_score']
        if avg_score < 7:
            recommendations.append({
                'type': 'warning',
                'title': '得分',
                'description': '得分较低，建议检查基础姿势和瞄准点。'
            })
        
        # 分析箭群
        if analysis['grouping']:
            dispersion = analysis['grouping']['dispersion']
            if dispersion > 0.2:  # 假设0.2是一个合理的阈值
                recommendations.append({
                    'type': 'warning',
                    'title': '箭群紧密度',
                    'description': '箭群较分散，建议加强动作一致性训练。'
                })
        
        return recommendations 