from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from logging.handlers import RotatingFileHandler

from pose_analysis.pose_analyzer import PoseAnalyzer
from target_analysis.target_analyzer import TargetAnalyzer
from utils.error_handler import error_handler, APIError

# 加载环境变量
load_dotenv()

# 创建Flask应用
app = Flask(__name__)
CORS(app)

# 配置日志
if not os.path.exists('logs'):
    os.makedirs('logs')

file_handler = RotatingFileHandler('logs/ai_service.log', maxBytes=10240000, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('AI服务启动')

# 初始化分析器
pose_analyzer = PoseAnalyzer()
target_analyzer = TargetAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'services': {
            'pose_analysis': pose_analyzer.is_ready(),
            'target_analysis': target_analyzer.is_ready()
        }
    })

@app.route('/analyze/pose', methods=['POST'])
def analyze_pose():
    """姿态分析接口"""
    if 'video' not in request.files:
        raise APIError('未找到视频文件', 400)
    
    video = request.files['video']
    if not video.filename:
        raise APIError('未选择文件', 400)
    
    # 分析参数
    params = {
        'extract_frames': request.form.get('extract_frames', 'true').lower() == 'true',
        'frame_rate': int(request.form.get('frame_rate', 30)),
        'save_keyframes': request.form.get('save_keyframes', 'true').lower() == 'true'
    }
    
    try:
        # 执行姿态分析
        result = pose_analyzer.analyze_video(video, params)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'姿态分析失败: {str(e)}')
        raise APIError('姿态分析失败', 500)

@app.route('/analyze/target', methods=['POST'])
def analyze_target():
    """箭靶分析接口"""
    if 'image' not in request.files:
        raise APIError('未找到图片文件', 400)
    
    image = request.files['image']
    if not image.filename:
        raise APIError('未选择文件', 400)
    
    # 分析参数
    params = {
        'distance': float(request.form.get('distance', 18)),  # 默认18米
        'target_type': request.form.get('target_type', 'standard'),  # 靶型
        'detect_arrows': request.form.get('detect_arrows', 'true').lower() == 'true'
    }
    
    try:
        # 执行箭靶分析
        result = target_analyzer.analyze_image(image, params)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'箭靶分析失败: {str(e)}')
        raise APIError('箭靶分析失败', 500)

@app.route('/analyze/realtime', methods=['POST'])
def analyze_realtime():
    """实时分析接口"""
    if 'frame' not in request.files:
        raise APIError('未找到帧图像', 400)
    
    frame = request.files['frame']
    if not frame.filename:
        raise APIError('未选择文件', 400)
    
    analysis_type = request.form.get('type', 'pose')
    
    try:
        if analysis_type == 'pose':
            result = pose_analyzer.analyze_frame(frame)
        elif analysis_type == 'target':
            result = target_analyzer.analyze_frame(frame)
        else:
            raise APIError('不支持的分析类型', 400)
        
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'实时分析失败: {str(e)}')
        raise APIError('实时分析失败', 500)

# 注册错误处理器
app.register_error_handler(APIError, error_handler)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000))) 