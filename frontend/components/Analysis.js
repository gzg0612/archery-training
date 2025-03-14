// 视频分析组件
const AnalysisComponent = {
  template: `
    <div class="fade-in">
      <!-- 页面标题和操作按钮 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">视频分析</h1>
        <div class="flex space-x-4">
          <el-button type="primary" @click="uploadVideo">
            <el-icon class="mr-1"><upload /></el-icon>上传视频
          </el-button>
          <el-button type="success" @click="startAnalysis" :disabled="!selectedVideo">
            <el-icon class="mr-1"><video-camera /></el-icon>开始分析
          </el-button>
        </div>
      </div>

      <!-- 视频分析区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：视频播放和关键帧 -->
        <div class="lg:col-span-2">
          <!-- 视频播放器 -->
          <div class="bg-black rounded-lg overflow-hidden mb-4">
            <div class="aspect-w-16 aspect-h-9">
              <video
                v-if="selectedVideo"
                ref="videoPlayer"
                class="w-full h-full object-contain"
                controls
                :src="selectedVideo.url"
                @timeupdate="handleTimeUpdate"
                @loadedmetadata="handleVideoLoaded"
              ></video>
              <div v-else class="flex items-center justify-center h-full bg-gray-800">
                <div class="text-center text-white">
                  <el-icon class="text-4xl mb-2"><video-camera /></el-icon>
                  <p>请选择或上传视频</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 关键帧时间轴 -->
          <div class="bg-white p-4 rounded-lg shadow mb-4">
            <h3 class="text-lg font-semibold mb-4">关键帧分析</h3>
            <div class="flex space-x-2 overflow-x-auto pb-2">
              <div
                v-for="(frame, index) in keyFrames"
                :key="index"
                class="flex-shrink-0 cursor-pointer"
                @click="jumpToTime(frame.time)"
              >
                <div class="relative">
                  <img
                    :src="frame.thumbnail"
                    :alt="frame.description"
                    class="w-32 h-20 object-cover rounded"
                  >
                  <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                    {{ frame.time }}s
                  </div>
                </div>
                <p class="text-sm mt-1">{{ frame.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：分析结果和建议 -->
        <div class="lg:col-span-1">
          <!-- 姿势评分 -->
          <div class="bg-white p-4 rounded-lg shadow mb-4">
            <h3 class="text-lg font-semibold mb-4">姿势评分</h3>
            <div class="space-y-4">
              <div v-for="(score, key) in poseScores" :key="key">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-gray-600">{{ score.label }}</span>
                  <span class="font-semibold" :class="getScoreClass(score.value)">{{ score.value }}分</span>
                </div>
                <el-progress
                  :percentage="score.value"
                  :status="getProgressStatus(score.value)"
                  :color="getProgressColor(score.value)"
                ></el-progress>
              </div>
            </div>
          </div>

          <!-- 改进建议 -->
          <div class="bg-white p-4 rounded-lg shadow mb-4">
            <h3 class="text-lg font-semibold mb-4">改进建议</h3>
            <div class="space-y-3">
              <div v-for="(suggestion, index) in improvementSuggestions" :key="index" class="flex items-start">
                <el-icon class="mt-1 mr-2" :class="getSuggestionIconClass(suggestion.type)">
                  <component :is="getSuggestionIcon(suggestion.type)" />
                </el-icon>
                <div>
                  <p class="font-medium">{{ suggestion.title }}</p>
                  <p class="text-sm text-gray-600">{{ suggestion.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 动作对比 -->
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">动作对比</h3>
            <div class="space-y-4">
              <div v-for="(comparison, index) in poseComparisons" :key="index">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-600">{{ comparison.label }}</span>
                  <el-tag :type="getComparisonType(comparison.difference)">
                    {{ comparison.difference > 0 ? '+' : '' }}{{ comparison.difference }}°
                  </el-tag>
                </div>
                <div class="flex space-x-2">
                  <div class="flex-1">
                    <img :src="comparison.current" alt="当前姿势" class="w-full rounded">
                    <p class="text-xs text-center mt-1">当前</p>
                  </div>
                  <div class="flex-1">
                    <img :src="comparison.ideal" alt="理想姿势" class="w-full rounded">
                    <p class="text-xs text-center mt-1">理想</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  setup() {
    const { ref, onMounted } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;

    // 状态数据
    const videoPlayer = ref(null);
    const selectedVideo = ref(null);
    const currentTime = ref(0);
    const duration = ref(0);

    // 模拟数据
    const keyFrames = ref([
      {
        time: 2.5,
        thumbnail: './assets/images/keyframe1.jpg',
        description: '准备姿势'
      },
      {
        time: 5.8,
        thumbnail: './assets/images/keyframe2.jpg',
        description: '拉弓过程'
      },
      {
        time: 8.2,
        thumbnail: './assets/images/keyframe3.jpg',
        description: '瞄准阶段'
      },
      {
        time: 10.5,
        thumbnail: './assets/images/keyframe4.jpg',
        description: '释放瞬间'
      }
    ]);

    const poseScores = ref([
      { label: '站姿稳定性', value: 85 },
      { label: '拉弓一致性', value: 78 },
      { label: '瞄准精度', value: 92 },
      { label: '释放控制', value: 88 }
    ]);

    const improvementSuggestions = ref([
      {
        type: 'success',
        title: '站姿稳定',
        description: '您的站姿整体稳定，建议继续保持'
      },
      {
        type: 'warning',
        title: '拉弓动作',
        description: '拉弓过程中存在轻微晃动，建议加强肩部力量训练'
      },
      {
        type: 'info',
        title: '瞄准时间',
        description: '瞄准时间略长，建议控制在2-3秒内完成'
      }
    ]);

    const poseComparisons = ref([
      {
        label: '肩部角度',
        difference: -3,
        current: './assets/images/current-shoulder.jpg',
        ideal: './assets/images/ideal-shoulder.jpg'
      },
      {
        label: '肘部位置',
        difference: 2,
        current: './assets/images/current-elbow.jpg',
        ideal: './assets/images/ideal-elbow.jpg'
      }
    ]);

    // 方法
    const uploadVideo = () => {
      ElMessage({
        message: '视频上传功能即将上线',
        type: 'info'
      });
    };

    const startAnalysis = () => {
      ElMessageBox.confirm(
        '确定要开始分析视频吗？分析过程可能需要几分钟时间。',
        '开始分析',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        ElMessage({
          message: '视频分析已开始，请稍候...',
          type: 'success'
        });
      }).catch(() => {
        // 取消操作
      });
    };

    const handleTimeUpdate = (event) => {
      currentTime.value = event.target.currentTime;
    };

    const handleVideoLoaded = (event) => {
      duration.value = event.target.duration;
    };

    const jumpToTime = (time) => {
      if (videoPlayer.value) {
        videoPlayer.value.currentTime = time;
      }
    };

    const getScoreClass = (score) => {
      if (score >= 90) return 'text-success';
      if (score >= 80) return 'text-primary';
      if (score >= 70) return 'text-warning';
      return 'text-danger';
    };

    const getProgressStatus = (score) => {
      if (score >= 90) return 'success';
      if (score >= 80) return 'warning';
      return '';
    };

    const getProgressColor = (score) => {
      if (score >= 90) return '#28A745';
      if (score >= 80) return '#1E4584';
      if (score >= 70) return '#FFC107';
      return '#DC3545';
    };

    const getSuggestionIcon = (type) => {
      switch (type) {
        case 'success':
          return 'check';
        case 'warning':
          return 'warning';
        case 'info':
          return 'info';
        default:
          return 'info';
      }
    };

    const getSuggestionIconClass = (type) => {
      switch (type) {
        case 'success':
          return 'text-success';
        case 'warning':
          return 'text-warning';
        case 'info':
          return 'text-info';
        default:
          return 'text-gray-500';
      }
    };

    const getComparisonType = (difference) => {
      if (Math.abs(difference) <= 2) return 'success';
      if (Math.abs(difference) <= 5) return 'warning';
      return 'danger';
    };

    // 初始化
    onMounted(() => {
      // 模拟加载已选择的视频
      selectedVideo.value = {
        url: './assets/videos/training-sample.mp4',
        name: '训练视频示例'
      };
    });

    return {
      videoPlayer,
      selectedVideo,
      currentTime,
      duration,
      keyFrames,
      poseScores,
      improvementSuggestions,
      poseComparisons,
      uploadVideo,
      startAnalysis,
      handleTimeUpdate,
      handleVideoLoaded,
      jumpToTime,
      getScoreClass,
      getProgressStatus,
      getProgressColor,
      getSuggestionIcon,
      getSuggestionIconClass,
      getComparisonType
    };
  }
};

// 注册组件
app.component('analysis-component', AnalysisComponent); 