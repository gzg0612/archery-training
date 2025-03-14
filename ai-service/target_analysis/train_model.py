import torch
import yaml
from pathlib import Path
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split

class TargetModelTrainer:
    def __init__(self):
        # 模型保存路径
        self.model_dir = Path(__file__).parent / 'models'
        self.model_dir.mkdir(exist_ok=True)
        
        # YOLOv5配置
        self.config = {
            'img_size': 640,
            'batch_size': 16,
            'epochs': 100,
            'weights': 'yolov5s.pt',  # 预训练权重
            'device': 'cuda' if torch.cuda.is_available() else 'cpu'
        }

    def prepare_dataset(self, data_dir):
        """准备训练数据集"""
        data_dir = Path(data_dir)
        
        # 创建数据集目录结构
        dataset_dir = self.model_dir / 'dataset'
        if dataset_dir.exists():
            shutil.rmtree(dataset_dir)
        
        for split in ['train', 'val']:
            (dataset_dir / split / 'images').mkdir(parents=True)
            (dataset_dir / split / 'labels').mkdir(parents=True)
        
        # 读取标注文件
        annotations = pd.read_csv(data_dir / 'annotations.csv')
        
        # 分割训练集和验证集
        train_data, val_data = train_test_split(
            annotations, test_size=0.2, random_state=42
        )
        
        # 处理训练集
        self._process_split(train_data, data_dir, dataset_dir / 'train')
        
        # 处理验证集
        self._process_split(val_data, data_dir, dataset_dir / 'val')
        
        # 创建数据集配置文件
        self._create_dataset_yaml(dataset_dir)
        
        return dataset_dir

    def _process_split(self, data, source_dir, target_dir):
        """处理数据集分割"""
        for _, row in data.iterrows():
            # 复制图片
            shutil.copy2(
                source_dir / 'images' / row['image_file'],
                target_dir / 'images' / row['image_file']
            )
            
            # 转换并保存标注
            label_file = Path(row['image_file']).stem + '.txt'
            self._convert_annotations(
                row['bbox'],
                row['class_id'],
                target_dir / 'labels' / label_file
            )

    def _convert_annotations(self, bbox, class_id, output_path):
        """转换标注格式为YOLO格式"""
        # bbox格式: x1,y1,x2,y2
        x1, y1, x2, y2 = map(float, bbox.split(','))
        
        # 转换为YOLO格式: class_id, x_center, y_center, width, height
        width = x2 - x1
        height = y2 - y1
        x_center = x1 + width / 2
        y_center = y1 + height / 2
        
        # 归一化坐标
        x_center /= 640  # 假设图像宽度为640
        y_center /= 640  # 假设图像高度为640
        width /= 640
        height /= 640
        
        # 保存标注
        with open(output_path, 'w') as f:
            f.write(f"{class_id} {x_center} {y_center} {width} {height}\n")

    def _create_dataset_yaml(self, dataset_dir):
        """创建数据集配置文件"""
        config = {
            'path': str(dataset_dir),
            'train': 'train/images',
            'val': 'val/images',
            'nc': 2,  # 类别数：箭靶和箭矢
            'names': ['target', 'arrow']
        }
        
        with open(dataset_dir / 'dataset.yaml', 'w') as f:
            yaml.dump(config, f)

    def train(self, data_dir):
        """训练模型"""
        print("准备数据集...")
        dataset_dir = self.prepare_dataset(data_dir)
        
        print("开始训练...")
        # 克隆YOLOv5仓库（如果不存在）
        yolov5_dir = self.model_dir / 'yolov5'
        if not yolov5_dir.exists():
            import git
            git.Repo.clone_from(
                'https://github.com/ultralytics/yolov5',
                yolov5_dir
            )
        
        # 安装YOLOv5依赖
        import subprocess
        subprocess.run(
            ['pip', 'install', '-r', str(yolov5_dir / 'requirements.txt')],
            check=True
        )
        
        # 训练命令
        cmd = [
            'python', str(yolov5_dir / 'train.py'),
            '--img', str(self.config['img_size']),
            '--batch', str(self.config['batch_size']),
            '--epochs', str(self.config['epochs']),
            '--data', str(dataset_dir / 'dataset.yaml'),
            '--weights', self.config['weights'],
            '--project', str(self.model_dir),
            '--name', 'target_detection'
        ]
        
        subprocess.run(cmd, check=True)
        
        # 复制最佳模型
        best_model = self.model_dir / 'target_detection' / 'weights' / 'best.pt'
        shutil.copy2(best_model, self.model_dir / 'target_detection_model.pt')

    def evaluate_model(self, test_dir):
        """评估模型在测试集上的表现"""
        test_dir = Path(test_dir)
        
        # 加载模型
        model = torch.hub.load(
            'ultralytics/yolov5',
            'custom',
            path=str(self.model_dir / 'target_detection_model.pt')
        )
        
        results = []
        for img_path in test_dir.glob('*.jpg'):
            # 执行检测
            pred = model(str(img_path))
            
            # 获取检测结果
            boxes = pred.xyxy[0].cpu().numpy()
            for box in boxes:
                x1, y1, x2, y2, conf, cls = box
                results.append({
                    'image': str(img_path),
                    'class': model.names[int(cls)],
                    'confidence': float(conf),
                    'bbox': f"{x1},{y1},{x2},{y2}"
                })
        
        # 保存评估结果
        pd.DataFrame(results).to_csv(
            self.model_dir / 'evaluation_results.csv',
            index=False
        )
        return results

if __name__ == '__main__':
    trainer = TargetModelTrainer()
    
    # 训练模型
    trainer.train('data/training')
    
    # 评估模型
    results = trainer.evaluate_model('data/testing')
    
    # 打印评估结果
    df = pd.DataFrame(results)
    print("\n检测结果统计:")
    print(df.groupby('class')['confidence'].describe()) 