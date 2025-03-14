import tensorflow as tf
import numpy as np
from pathlib import Path
import json
import cv2
import mediapipe as mp
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, LSTM
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import pandas as pd

class PoseModelTrainer:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            min_detection_confidence=0.7
        )
        
        # 模型保存路径
        self.model_dir = Path(__file__).parent / 'models'
        self.model_dir.mkdir(exist_ok=True)
        
        # 训练配置
        self.config = {
            'sequence_length': 30,  # 每个训练序列的帧数
            'num_features': 99,     # 33个关键点 * 3(x,y,z)
            'num_classes': 5,       # 动作类别数
            'batch_size': 32,
            'epochs': 100,
            'validation_split': 0.2
        }

    def prepare_dataset(self, data_dir):
        """准备训练数据集"""
        data_dir = Path(data_dir)
        sequences = []
        labels = []
        
        # 遍历所有训练视频
        for video_path in data_dir.glob('**/*.mp4'):
            label = video_path.parent.name  # 使用父目录名作为标签
            sequence = self._extract_pose_sequence(video_path)
            if sequence is not None:
                sequences.append(sequence)
                labels.append(label)
        
        # 转换为numpy数组
        X = np.array(sequences)
        y = pd.get_dummies(labels).values  # one-hot编码
        
        # 保存标签映射
        label_map = {i: label for i, label in enumerate(pd.get_dummies(labels).columns)}
        with open(self.model_dir / 'label_map.json', 'w') as f:
            json.dump(label_map, f)
        
        return train_test_split(X, y, test_size=0.2, random_state=42)

    def _extract_pose_sequence(self, video_path):
        """从视频中提取姿态序列"""
        cap = cv2.VideoCapture(str(video_path))
        frames = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # 转换颜色空间
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # 检测姿态
            results = self.pose.process(frame_rgb)
            if results.pose_landmarks is None:
                continue
            
            # 提取关键点坐标
            landmarks = np.array([[lm.x, lm.y, lm.z] for lm in results.pose_landmarks.landmark])
            frames.append(landmarks.flatten())  # 展平为一维数组
            
            if len(frames) >= self.config['sequence_length']:
                break
        
        cap.release()
        
        # 如果帧数不足，则丢弃该序列
        if len(frames) < self.config['sequence_length']:
            return None
        
        return np.array(frames[:self.config['sequence_length']])

    def build_model(self):
        """构建LSTM模型"""
        model = Sequential([
            LSTM(128, return_sequences=True, 
                 input_shape=(self.config['sequence_length'], self.config['num_features'])),
            Dropout(0.3),
            LSTM(64, return_sequences=False),
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dropout(0.3),
            Dense(self.config['num_classes'], activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model

    def train(self, data_dir):
        """训练模型"""
        print("准备数据集...")
        X_train, X_test, y_train, y_test = self.prepare_dataset(data_dir)
        
        print("构建模型...")
        model = self.build_model()
        
        # 设置回调
        callbacks = [
            ModelCheckpoint(
                str(self.model_dir / 'archery_pose_model.h5'),
                save_best_only=True,
                monitor='val_accuracy'
            ),
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            )
        ]
        
        print("开始训练...")
        history = model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test),
            epochs=self.config['epochs'],
            batch_size=self.config['batch_size'],
            callbacks=callbacks
        )
        
        # 保存训练历史
        history_df = pd.DataFrame(history.history)
        history_df.to_csv(self.model_dir / 'training_history.csv')
        
        # 评估模型
        print("\n评估模型...")
        test_loss, test_accuracy = model.evaluate(X_test, y_test)
        print(f"测试集准确率: {test_accuracy:.4f}")
        
        return history

    def evaluate_model(self, test_dir):
        """评估模型在测试集上的表现"""
        model = tf.keras.models.load_model(str(self.model_dir / 'archery_pose_model.h5'))
        
        # 加载标签映射
        with open(self.model_dir / 'label_map.json', 'r') as f:
            label_map = json.load(f)
        
        results = []
        for video_path in Path(test_dir).glob('**/*.mp4'):
            sequence = self._extract_pose_sequence(video_path)
            if sequence is not None:
                prediction = model.predict(np.expand_dims(sequence, axis=0))
                predicted_class = label_map[str(np.argmax(prediction[0]))]
                true_class = video_path.parent.name
                
                results.append({
                    'video': str(video_path),
                    'true_class': true_class,
                    'predicted_class': predicted_class,
                    'confidence': float(np.max(prediction[0]))
                })
        
        # 保存评估结果
        pd.DataFrame(results).to_csv(self.model_dir / 'evaluation_results.csv', index=False)
        return results

if __name__ == '__main__':
    trainer = PoseModelTrainer()
    
    # 训练模型
    trainer.train('data/training')
    
    # 评估模型
    results = trainer.evaluate_model('data/testing')
    
    # 打印评估结果
    df = pd.DataFrame(results)
    accuracy = (df['true_class'] == df['predicted_class']).mean()
    print(f"\n模型准确率: {accuracy:.4f}")
    print("\n分类报告:")
    print(pd.crosstab(df['true_class'], df['predicted_class'])) 