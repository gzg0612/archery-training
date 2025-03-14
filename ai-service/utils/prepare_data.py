import cv2
import numpy as np
from pathlib import Path
import shutil
import json
import pandas as pd
from tqdm import tqdm

def prepare_pose_data(source_dir, output_dir):
    """准备姿态分析训练数据"""
    source_dir = Path(source_dir)
    output_dir = Path(output_dir)
    
    # 创建输出目录
    for split in ['training', 'testing']:
        for category in ['perfect', 'good', 'average', 'poor', 'incorrect']:
            (output_dir / split / category).mkdir(parents=True, exist_ok=True)
    
    # 读取视频标注
    annotations = pd.read_csv(source_dir / 'pose_annotations.csv')
    
    # 处理每个视频
    for _, row in tqdm(annotations.iterrows(), desc="处理姿态视频"):
        video_path = source_dir / 'videos' / row['video_file']
        if not video_path.exists():
            print(f"警告: 找不到视频文件 {video_path}")
            continue
        
        # 确定目标目录
        target_dir = output_dir / row['split'] / row['category']
        
        # 复制视频
        shutil.copy2(video_path, target_dir / video_path.name)

def prepare_target_data(source_dir, output_dir):
    """准备箭靶检测训练数据"""
    source_dir = Path(source_dir)
    output_dir = Path(output_dir)
    
    # 创建输出目录结构
    for split in ['training', 'testing']:
        (output_dir / split / 'images').mkdir(parents=True, exist_ok=True)
        (output_dir / split / 'labels').mkdir(parents=True, exist_ok=True)
    
    # 读取图像标注
    annotations = pd.read_csv(source_dir / 'target_annotations.csv')
    
    # 处理每张图片
    processed_data = []
    for _, row in tqdm(annotations.iterrows(), desc="处理箭靶图片"):
        img_path = source_dir / 'images' / row['image_file']
        if not img_path.exists():
            print(f"警告: 找不到图片文件 {img_path}")
            continue
        
        # 确定目标目录
        target_dir = output_dir / row['split']
        
        # 复制图片
        shutil.copy2(img_path, target_dir / 'images' / img_path.name)
        
        # 处理标注数据
        for obj in json.loads(row['annotations']):
            processed_data.append({
                'image_file': img_path.name,
                'split': row['split'],
                'class_id': 0 if obj['class'] == 'target' else 1,
                'bbox': ','.join(map(str, obj['bbox']))
            })
    
    # 保存处理后的标注
    pd.DataFrame(processed_data).to_csv(output_dir / 'annotations.csv', index=False)

def verify_data(data_dir):
    """验证数据集完整性"""
    data_dir = Path(data_dir)
    
    # 验证姿态数据
    pose_dir = data_dir / 'pose'
    if pose_dir.exists():
        print("\n验证姿态数据:")
        for split in ['training', 'testing']:
            split_dir = pose_dir / split
            if split_dir.exists():
                categories = [d.name for d in split_dir.iterdir() if d.is_dir()]
                videos = sum(len(list((split_dir / cat).glob('*.mp4'))) 
                           for cat in categories)
                print(f"{split}: {videos} 个视频, 类别: {categories}")
    
    # 验证箭靶数据
    target_dir = data_dir / 'target'
    if target_dir.exists():
        print("\n验证箭靶数据:")
        for split in ['training', 'testing']:
            split_dir = target_dir / split
            if split_dir.exists():
                images = len(list((split_dir / 'images').glob('*.jpg')))
                labels = len(list((split_dir / 'labels').glob('*.txt')))
                print(f"{split}: {images} 张图片, {labels} 个标注文件")

def main():
    # 设置数据目录
    raw_data_dir = Path('data/raw')
    processed_data_dir = Path('data/processed')
    
    # 准备姿态数据
    pose_output_dir = processed_data_dir / 'pose'
    print("准备姿态分析训练数据...")
    prepare_pose_data(raw_data_dir / 'pose', pose_output_dir)
    
    # 准备箭靶数据
    target_output_dir = processed_data_dir / 'target'
    print("\n准备箭靶检测训练数据...")
    prepare_target_data(raw_data_dir / 'target', target_output_dir)
    
    # 验证数据集
    print("\n验证数据集完整性...")
    verify_data(processed_data_dir)

if __name__ == '__main__':
    main() 