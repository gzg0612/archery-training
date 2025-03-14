#!/bin/bash
# train_all_models.sh - 完整训练流程脚本

# 设置环境
export CUDA_VISIBLE_DEVICES=0  # 指定GPU设备
export TF_FORCE_GPU_ALLOW_GROWTH=true  # TensorFlow内存增长设置

# 设置目录
AI_SERVICE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$AI_SERVICE_DIR/data"
LOG_DIR="$AI_SERVICE_DIR/logs"
mkdir -p $LOG_DIR

# 记录开始时间
START_TIME=$(date +%s)
echo "开始训练流程：$(date)"

# 准备数据
echo "1. 开始准备训练数据..."
python $AI_SERVICE_DIR/utils/prepare_data.py > $LOG_DIR/data_prep.log 2>&1
if [ $? -ne 0 ]; then
    echo "数据准备失败，请查看日志：$LOG_DIR/data_prep.log"
    exit 1
fi
echo "数据准备完成。"

# 训练姿态分析模型
echo "2. 开始训练姿态分析模型..."
python $AI_SERVICE_DIR/pose_analysis/train_model.py > $LOG_DIR/pose_training.log 2>&1
if [ $? -ne 0 ]; then
    echo "姿态分析模型训练失败，请查看日志：$LOG_DIR/pose_training.log"
    exit 1
fi
echo "姿态分析模型训练完成。"

# 训练箭靶检测模型
echo "3. 开始训练箭靶检测模型..."
python $AI_SERVICE_DIR/target_analysis/train_model.py > $LOG_DIR/target_training.log 2>&1
if [ $? -ne 0 ]; then
    echo "箭靶检测模型训练失败，请查看日志：$LOG_DIR/target_training.log"
    exit 1
fi
echo "箭靶检测模型训练完成。"

# 计算总时长
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(( (DURATION % 3600) / 60 ))
SECONDS=$((DURATION % 60))

echo ""
echo "训练结束：$(date)"
echo "总训练时长：${HOURS}时${MINUTES}分${SECONDS}秒"
echo ""
echo "姿态分析模型保存在：$AI_SERVICE_DIR/pose_analysis/models/"
echo "箭靶检测模型保存在：$AI_SERVICE_DIR/target_analysis/models/"
echo ""
echo "训练结果摘要："
grep "模型准确率" $LOG_DIR/pose_training.log
grep "Average Precision" $LOG_DIR/target_training.log
echo ""
echo "详细结果请查看日志目录：$LOG_DIR/" 