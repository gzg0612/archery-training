// 训练计划组件
const TrainingComponent = {
  template: `
    <div class="fade-in">
      <!-- 页面标题和操作按钮 -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">训练计划</h1>
        <el-button type="primary" @click="createNewPlan">
          <el-icon class="mr-1"><plus /></el-icon>创建新计划
        </el-button>
      </div>

      <!-- 训练计划列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div v-for="plan in trainingPlans" :key="plan.id" class="custom-card p-4">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold">{{ plan.name }}</h3>
              <p class="text-gray-600 text-sm">{{ plan.type }}</p>
            </div>
            <el-tag :type="getPlanStatusType(plan.status)">{{ plan.status }}</el-tag>
          </div>
          
          <div class="mb-4">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>开始日期</span>
              <span>{{ plan.startDate }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>结束日期</span>
              <span>{{ plan.endDate }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600">
              <span>完成进度</span>
              <span>{{ plan.progress }}%</span>
            </div>
          </div>

          <el-progress :percentage="plan.progress" :status="getProgressStatus(plan.progress)" class="mb-4"></el-progress>

          <div class="flex justify-between">
            <el-button type="primary" link @click="viewPlanDetail(plan)">查看详情</el-button>
            <el-button type="primary" link @click="startTraining(plan)" :disabled="plan.status === '已完成'">
              开始训练
            </el-button>
          </div>
        </div>
      </div>

      <!-- 训练计划详情对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="currentPlan?.name"
        width="70%"
        class="plan-detail-dialog"
      >
        <div v-if="currentPlan" class="plan-detail-content">
          <!-- 基本信息 -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4">基本信息</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-gray-600">计划类型：</span>
                <span>{{ currentPlan.type }}</span>
              </div>
              <div>
                <span class="text-gray-600">状态：</span>
                <el-tag :type="getPlanStatusType(currentPlan.status)">{{ currentPlan.status }}</el-tag>
              </div>
              <div>
                <span class="text-gray-600">开始日期：</span>
                <span>{{ currentPlan.startDate }}</span>
              </div>
              <div>
                <span class="text-gray-600">结束日期：</span>
                <span>{{ currentPlan.endDate }}</span>
              </div>
              <div>
                <span class="text-gray-600">完成进度：</span>
                <span>{{ currentPlan.progress }}%</span>
              </div>
              <div>
                <span class="text-gray-600">训练频率：</span>
                <span>{{ currentPlan.frequency }}</span>
              </div>
            </div>
          </div>

          <!-- 训练内容 -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4">训练内容</h3>
            <div class="timeline-container">
              <div v-for="(item, index) in currentPlan.trainingItems" :key="index" class="timeline-item">
                <div class="bg-white p-4 rounded-lg shadow">
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium">{{ item.name }}</h4>
                    <el-tag size="small" :type="getItemStatusType(item.status)">{{ item.status }}</el-tag>
                  </div>
                  <p class="text-gray-600 text-sm mb-2">{{ item.description }}</p>
                  <div class="flex justify-between text-sm text-gray-500">
                    <span>时长：{{ item.duration }}</span>
                    <span>难度：{{ item.difficulty }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 训练记录 -->
          <div>
            <h3 class="text-lg font-semibold mb-4">训练记录</h3>
            <el-table :data="currentPlan.trainingRecords" stripe style="width: 100%">
              <el-table-column prop="date" label="日期" width="120"></el-table-column>
              <el-table-column prop="duration" label="时长" width="100"></el-table-column>
              <el-table-column prop="type" label="训练类型" width="120"></el-table-column>
              <el-table-column prop="score" label="得分" width="100">
                <template #default="scope">
                  <span :class="getScoreClass(scope.row.score)">{{ scope.row.score }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="comment" label="备注"></el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button type="primary" link @click="viewTrainingDetail(scope.row)">详情</el-button>
                  <el-button type="primary" link @click="viewVideoAnalysis(scope.row)">视频</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-dialog>
    </div>
  `,

  setup() {
    const { ref, getCurrentInstance } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;

    // 获取当前实例
    const instance = getCurrentInstance();

    // 状态数据
    const dialogVisible = ref(false);
    const currentPlan = ref(null);

    // 模拟训练计划数据
    const trainingPlans = ref([
      {
        id: 1,
        name: '基础技术提升计划',
        type: '技术训练',
        status: '进行中',
        startDate: '2023-12-01',
        endDate: '2023-12-31',
        progress: 45,
        frequency: '每周4次',
        trainingItems: [
          {
            name: '基础姿势训练',
            status: '已完成',
            description: '练习标准站姿和握弓姿势',
            duration: '30分钟',
            difficulty: '初级'
          },
          {
            name: '拉弓稳定性训练',
            status: '进行中',
            description: '提高拉弓动作的稳定性',
            duration: '45分钟',
            difficulty: '中级'
          },
          {
            name: '瞄准精度训练',
            status: '未开始',
            description: '提升瞄准的准确性和稳定性',
            duration: '60分钟',
            difficulty: '高级'
          }
        ],
        trainingRecords: [
          {
            date: '2023-12-01',
            duration: '30分钟',
            type: '基础训练',
            score: 85,
            comment: '姿势有改善'
          },
          {
            date: '2023-12-03',
            duration: '45分钟',
            type: '技术训练',
            score: 82,
            comment: '需要加强稳定性'
          }
        ]
      },
      {
        id: 2,
        name: '力量训练计划',
        type: '体能训练',
        status: '未开始',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        progress: 0,
        frequency: '每周3次',
        trainingItems: [
          {
            name: '核心力量训练',
            status: '未开始',
            description: '增强核心肌群力量',
            duration: '45分钟',
            difficulty: '中级'
          },
          {
            name: '肩部力量训练',
            status: '未开始',
            description: '提高肩部稳定性',
            duration: '40分钟',
            difficulty: '中级'
          }
        ],
        trainingRecords: []
      }
    ]);

    // 方法
    const getPlanStatusType = (status) => {
      switch (status) {
        case '进行中':
          return 'primary';
        case '已完成':
          return 'success';
        case '未开始':
          return 'info';
        default:
          return '';
      }
    };

    const getItemStatusType = (status) => {
      switch (status) {
        case '已完成':
          return 'success';
        case '进行中':
          return 'primary';
        case '未开始':
          return 'info';
        default:
          return '';
      }
    };

    const getProgressStatus = (progress) => {
      if (progress >= 100) return 'success';
      if (progress >= 80) return 'warning';
      return '';
    };

    const getScoreClass = (score) => {
      if (score >= 90) return 'text-success font-bold';
      if (score >= 80) return 'text-primary font-bold';
      if (score >= 70) return 'text-warning font-bold';
      return 'text-danger font-bold';
    };

    const createNewPlan = () => {
      ElMessage({
        message: '创建新计划功能即将上线',
        type: 'info'
      });
    };

    const viewPlanDetail = (plan) => {
      currentPlan.value = plan;
      dialogVisible.value = true;
    };

    const startTraining = (plan) => {
      ElMessageBox.confirm(
        `确定要开始"${plan.name}"的训练吗？`,
        '开始训练',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        ElMessage({
          message: '训练已开始，请做好准备',
          type: 'success'
        });
      }).catch(() => {
        // 取消操作
      });
    };

    const viewTrainingDetail = (training) => {
      ElMessageBox.alert(
        `训练日期: ${training.date}<br/>
        训练时长: ${training.duration}<br/>
        训练类型: ${training.type}<br/>
        得分: ${training.score}<br/>
        备注: ${training.comment}`,
        '训练详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '关闭'
        }
      );
    };

    const viewVideoAnalysis = (training) => {
      // 切换到视频分析页面
      window.location.hash = 'analysis';
    };

    return {
      dialogVisible,
      currentPlan,
      trainingPlans,
      getPlanStatusType,
      getItemStatusType,
      getProgressStatus,
      getScoreClass,
      createNewPlan,
      viewPlanDetail,
      startTraining,
      viewTrainingDetail,
      viewVideoAnalysis
    };
  }
};

// 注册组件
app.component('training-component', TrainingComponent); 