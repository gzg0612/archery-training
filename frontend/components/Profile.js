// 个人中心组件
const ProfileComponent = {
  template: `
    <div class="fade-in">
      <!-- 页面标题 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">个人中心</h1>
        <el-button type="primary" @click="editProfile">
          <el-icon class="mr-1"><edit /></el-icon>编辑资料
        </el-button>
      </div>

      <!-- 个人信息卡片 -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex items-start">
          <div class="relative">
            <img :src="userInfo.avatar" alt="用户头像" class="w-32 h-32 rounded-full object-cover">
            <el-button
              class="absolute bottom-0 right-0"
              type="primary"
              circle
              size="small"
              @click="changeAvatar"
            >
              <el-icon><camera /></el-icon>
            </el-button>
          </div>
          <div class="ml-6 flex-1">
            <div class="flex items-center mb-4">
              <h2 class="text-xl font-bold mr-4">{{ userInfo.name }}</h2>
              <el-tag :type="getLevelTagType(userInfo.level)">Lv.{{ userInfo.level }}</el-tag>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span class="text-gray-600">训练时长：</span>
                <span class="font-medium">{{ userInfo.totalHours }}小时</span>
              </div>
              <div>
                <span class="text-gray-600">训练次数：</span>
                <span class="font-medium">{{ userInfo.totalTrainings }}次</span>
              </div>
              <div>
                <span class="text-gray-600">平均得分：</span>
                <span class="font-medium">{{ userInfo.averageScore }}分</span>
              </div>
              <div>
                <span class="text-gray-600">进步率：</span>
                <span class="font-medium" :class="getProgressClass(userInfo.improvementRate)">
                  {{ userInfo.improvementRate }}%
                </span>
              </div>
            </div>
            <div class="flex space-x-4">
              <el-button type="primary" @click="viewTrainingHistory">训练历史</el-button>
              <el-button type="success" @click="viewAchievements">我的成就</el-button>
              <el-button type="info" @click="viewSettings">系统设置</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 训练统计图表 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">训练趋势</h3>
          <div ref="trainingTrendChart" style="height: 300px;"></div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">得分分布</h3>
          <div ref="scoreDistributionChart" style="height: 300px;"></div>
        </div>
      </div>

      <!-- 最近成就 -->
      <div class="bg-white p-4 rounded-lg shadow mb-6">
        <h3 class="text-lg font-semibold mb-4">最近成就</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="achievement in recentAchievements"
            :key="achievement.id"
            class="text-center"
          >
            <div class="relative inline-block">
              <img
                :src="achievement.icon"
                :alt="achievement.name"
                class="w-16 h-16 mx-auto mb-2"
              >
              <el-tooltip
                :content="achievement.description"
                placement="top"
                :show-after="500"
              >
                <div class="absolute inset-0 flex items-center justify-center">
                  <el-icon v-if="achievement.unlocked" class="text-success text-xl">
                    <check />
                  </el-icon>
                </div>
              </el-tooltip>
            </div>
            <p class="text-sm font-medium">{{ achievement.name }}</p>
            <p class="text-xs text-gray-500">{{ achievement.date }}</p>
          </div>
        </div>
      </div>

      <!-- 训练记录 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">训练记录</h3>
          <el-button type="primary" link @click="viewAllRecords">查看全部</el-button>
        </div>
        <el-table :data="recentRecords" stripe style="width: 100%">
          <el-table-column prop="date" label="日期" width="120"></el-table-column>
          <el-table-column prop="type" label="训练类型" width="120"></el-table-column>
          <el-table-column prop="duration" label="时长" width="100"></el-table-column>
          <el-table-column prop="score" label="得分" width="100">
            <template #default="scope">
              <span :class="getScoreClass(scope.row.score)">{{ scope.row.score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="improvement" label="进步" width="100">
            <template #default="scope">
              <span :class="getProgressClass(scope.row.improvement)">
                {{ scope.row.improvement > 0 ? '+' : '' }}{{ scope.row.improvement }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="备注"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="primary" link @click="viewRecordDetail(scope.row)">详情</el-button>
              <el-button type="primary" link @click="viewVideoAnalysis(scope.row)">视频</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 编辑资料对话框 -->
      <el-dialog
        v-model="editDialogVisible"
        title="编辑个人资料"
        width="500px"
      >
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="头像">
            <el-upload
              class="avatar-uploader"
              action="/api/upload"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
            >
              <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar">
              <el-icon v-else class="avatar-uploader-icon"><plus /></el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="editForm.name"></el-input>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="editForm.email"></el-input>
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="editForm.phone"></el-input>
          </el-form-item>
          <el-form-item label="个人简介">
            <el-input
              v-model="editForm.bio"
              type="textarea"
              :rows="3"
            ></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveProfile">保存</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  `,

  setup() {
    const { ref, onMounted } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;

    // 状态数据
    const editDialogVisible = ref(false);
    const trainingTrendChart = ref(null);
    const scoreDistributionChart = ref(null);

    // 用户信息
    const userInfo = ref({
      name: '张教练',
      avatar: './assets/images/avatar.png',
      level: 5,
      totalHours: 128,
      totalTrainings: 156,
      averageScore: 85,
      improvementRate: 12.5,
      email: 'zhang@example.com',
      phone: '13800138000',
      bio: '专业射箭教练，致力于帮助学员提升射箭技术。'
    });

    // 编辑表单
    const editForm = ref({
      name: '',
      avatar: '',
      email: '',
      phone: '',
      bio: ''
    });

    // 最近成就
    const recentAchievements = ref([
      {
        id: 1,
        name: '百发百中',
        description: '连续10次训练得分超过90分',
        icon: './assets/images/achievement1.png',
        unlocked: true,
        date: '2023-12-01'
      },
      {
        id: 2,
        name: '坚持不懈',
        description: '连续30天进行训练',
        icon: './assets/images/achievement2.png',
        unlocked: true,
        date: '2023-12-05'
      },
      {
        id: 3,
        name: '技术突破',
        description: '单次训练得分突破95分',
        icon: './assets/images/achievement3.png',
        unlocked: false,
        date: '未解锁'
      },
      {
        id: 4,
        name: '完美姿势',
        description: '姿势评分达到100分',
        icon: './assets/images/achievement4.png',
        unlocked: false,
        date: '未解锁'
      }
    ]);

    // 最近训练记录
    const recentRecords = ref([
      {
        date: '2023-12-10',
        type: '技术训练',
        duration: '1.5小时',
        score: 92,
        improvement: 3,
        comment: '拉弓稳定性有显著提升'
      },
      {
        date: '2023-12-08',
        type: '力量训练',
        duration: '1小时',
        score: 85,
        improvement: 2,
        comment: '肩部力量增强'
      },
      {
        date: '2023-12-05',
        type: '比赛模拟',
        duration: '2小时',
        score: 88,
        improvement: -1,
        comment: '需要加强心理素质'
      }
    ]);

    // 方法
    const getLevelTagType = (level) => {
      if (level >= 10) return 'danger';
      if (level >= 5) return 'warning';
      return 'success';
    };

    const getProgressClass = (progress) => {
      if (progress > 0) return 'text-success';
      if (progress < 0) return 'text-danger';
      return 'text-gray-500';
    };

    const getScoreClass = (score) => {
      if (score >= 90) return 'text-success font-bold';
      if (score >= 80) return 'text-primary font-bold';
      if (score >= 70) return 'text-warning font-bold';
      return 'text-danger font-bold';
    };

    const editProfile = () => {
      editForm.value = { ...userInfo.value };
      editDialogVisible.value = true;
    };

    const saveProfile = () => {
      // 模拟保存
      userInfo.value = { ...editForm.value };
      editDialogVisible.value = false;
      ElMessage({
        message: '个人资料已更新',
        type: 'success'
      });
    };

    const changeAvatar = () => {
      ElMessage({
        message: '头像上传功能即将上线',
        type: 'info'
      });
    };

    const viewTrainingHistory = () => {
      window.location.hash = 'training';
    };

    const viewAchievements = () => {
      ElMessage({
        message: '成就系统即将上线',
        type: 'info'
      });
    };

    const viewSettings = () => {
      ElMessage({
        message: '系统设置功能即将上线',
        type: 'info'
      });
    };

    const viewAllRecords = () => {
      window.location.hash = 'training';
    };

    const viewRecordDetail = (record) => {
      ElMessageBox.alert(
        `训练日期: ${record.date}<br/>
        训练类型: ${record.type}<br/>
        训练时长: ${record.duration}<br/>
        得分: ${record.score}<br/>
        进步: ${record.improvement}%<br/>
        备注: ${record.comment}`,
        '训练详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '关闭'
        }
      );
    };

    const viewVideoAnalysis = (record) => {
      window.location.hash = 'analysis';
    };

    const handleAvatarSuccess = (response) => {
      editForm.value.avatar = response.url;
    };

    const beforeAvatarUpload = (file) => {
      const isJPG = file.type === 'image/jpeg';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        ElMessage.error('上传头像图片只能是 JPG 格式!');
      }
      if (!isLt2M) {
        ElMessage.error('上传头像图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    };

    // 初始化图表
    const initCharts = () => {
      // 训练趋势图表
      if (window.echarts && trainingTrendChart.value) {
        const chart = window.echarts.init(trainingTrendChart.value);
        const option = {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['训练时长', '训练次数']
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['1月', '2月', '3月', '4月', '5月', '6月']
          },
          yAxis: [
            {
              type: 'value',
              name: '时长(小时)',
              position: 'left'
            },
            {
              type: 'value',
              name: '次数',
              position: 'right'
            }
          ],
          series: [
            {
              name: '训练时长',
              type: 'line',
              data: [20, 25, 30, 28, 35, 32],
              itemStyle: {
                color: '#1E4584'
              }
            },
            {
              name: '训练次数',
              type: 'line',
              yAxisIndex: 1,
              data: [15, 18, 22, 20, 25, 23],
              itemStyle: {
                color: '#FF6B35'
              }
            }
          ]
        };
        chart.setOption(option);
      }

      // 得分分布图表
      if (window.echarts && scoreDistributionChart.value) {
        const chart = window.echarts.init(scoreDistributionChart.value);
        const option = {
          tooltip: {
            trigger: 'item'
          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [
            {
              type: 'pie',
              radius: '50%',
              data: [
                { value: 35, name: '90分以上' },
                { value: 45, name: '80-90分' },
                { value: 15, name: '70-80分' },
                { value: 5, name: '70分以下' }
              ],
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        };
        chart.setOption(option);
      }
    };

    // 初始化
    onMounted(() => {
      // 延迟初始化图表，确保DOM已渲染
      setTimeout(initCharts, 100);

      // 动态加载ECharts
      if (!window.echarts) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
        script.onload = initCharts;
        document.head.appendChild(script);
      }
    });

    return {
      editDialogVisible,
      userInfo,
      editForm,
      recentAchievements,
      recentRecords,
      trainingTrendChart,
      scoreDistributionChart,
      getLevelTagType,
      getProgressClass,
      getScoreClass,
      editProfile,
      saveProfile,
      changeAvatar,
      viewTrainingHistory,
      viewAchievements,
      viewSettings,
      viewAllRecords,
      viewRecordDetail,
      viewVideoAnalysis,
      handleAvatarSuccess,
      beforeAvatarUpload
    };
  }
};

// 注册组件
app.component('profile-component', ProfileComponent); 