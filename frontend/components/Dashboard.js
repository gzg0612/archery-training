// 仪表盘组件
const DashboardComponent = {
  template: `
    <div class="fade-in">
      <h1 class="text-2xl font-bold mb-6">欢迎回来，{{ userName }}</h1>
      
      <!-- 概览统计数据 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="stat-card">
          <el-icon class="text-primary text-xl"><calendar /></el-icon>
          <div class="stat-value text-primary">{{ stats.totalTrainings }}</div>
          <div class="stat-label">总训练次数</div>
        </div>
        <div class="stat-card">
          <el-icon class="text-accent text-xl"><video-camera /></el-icon>
          <div class="stat-value text-accent">{{ stats.analyzedVideos }}</div>
          <div class="stat-label">已分析视频</div>
        </div>
        <div class="stat-card">
          <el-icon class="text-success text-xl"><data-line /></el-icon>
          <div class="stat-value text-success">{{ stats.improvementRate }}%</div>
          <div class="stat-label">进步率</div>
        </div>
        <div class="stat-card">
          <el-icon class="text-warning text-xl"><timer /></el-icon>
          <div class="stat-value text-warning">{{ stats.totalHours }}小时</div>
          <div class="stat-label">总训练时长</div>
        </div>
      </div>
      
      <!-- 最近训练和分析图表 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">训练进度</h2>
            <el-select v-model="timeRange" placeholder="选择时间范围" size="small">
              <el-option label="最近7天" value="7days"></el-option>
              <el-option label="最近30天" value="30days"></el-option>
              <el-option label="最近3个月" value="3months"></el-option>
            </el-select>
          </div>
          <div id="training-progress-chart" style="height: 300px;" ref="trainingProgressChart"></div>
        </div>
        
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">关键指标对比</h2>
            <el-select v-model="metricsType" placeholder="选择指标" size="small">
              <el-option label="姿势稳定性" value="stability"></el-option>
              <el-option label="拉弓一致性" value="consistency"></el-option>
              <el-option label="命中精度" value="accuracy"></el-option>
            </el-select>
          </div>
          <div id="metrics-chart" style="height: 300px;" ref="metricsChart"></div>
        </div>
      </div>
      
      <!-- 最近训练记录 -->
      <div class="bg-white p-4 rounded-lg shadow mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">最近训练记录</h2>
          <el-button type="primary" size="small" @click="viewAllTrainings">查看全部</el-button>
        </div>
        <el-table :data="recentTrainings" stripe style="width: 100%">
          <el-table-column prop="date" label="日期" width="120"></el-table-column>
          <el-table-column prop="duration" label="时长" width="80"></el-table-column>
          <el-table-column prop="type" label="训练类型" width="120"></el-table-column>
          <el-table-column prop="score" label="得分" width="80">
            <template #default="scope">
              <span :class="getScoreClass(scope.row.score)">{{ scope.row.score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="improvement" label="进步" width="100">
            <template #default="scope">
              <div class="flex items-center">
                <el-icon v-if="scope.row.improvement > 0" class="text-success mr-1"><top /></el-icon>
                <el-icon v-else-if="scope.row.improvement < 0" class="text-danger mr-1"><bottom /></el-icon>
                <span :class="getImprovementClass(scope.row.improvement)">{{ Math.abs(scope.row.improvement) }}%</span>
              </div>
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
      
      <!-- 建议和提示 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">训练建议</h2>
        <el-alert
          v-for="(tip, index) in trainingTips"
          :key="index"
          :title="tip.title"
          :type="tip.type"
          :description="tip.description"
          :closable="false"
          class="mb-3"
          show-icon
        ></el-alert>
      </div>
    </div>
  `,
  
  setup() {
    const { ref, onMounted, getCurrentInstance } = Vue;
    
    // 获取当前实例，用于访问父组件的数据
    const instance = getCurrentInstance();
    const userName = instance.appContext.config.globalProperties.userName || '用户';
    
    // 状态数据
    const timeRange = ref('7days');
    const metricsType = ref('stability');
    const trainingProgressChart = ref(null);
    const metricsChart = ref(null);
    
    // 模拟数据
    const stats = ref({
      totalTrainings: 26,
      analyzedVideos: 18,
      improvementRate: 12.5,
      totalHours: 32
    });
    
    const recentTrainings = ref([
      { date: '2023-12-01', duration: '1.5h', type: '技术训练', score: 85, improvement: 3, comment: '拉弓姿势有改善' },
      { date: '2023-11-27', duration: '2h', type: '力量训练', score: 78, improvement: -2, comment: '需要加强肩部稳定性' },
      { date: '2023-11-25', duration: '1h', type: '比赛模拟', score: 92, improvement: 5, comment: '表现优秀' },
      { date: '2023-11-20', duration: '1.5h', type: '基础训练', score: 81, improvement: 2, comment: '释放控制有进步' },
      { date: '2023-11-15', duration: '2h', type: '集中训练', score: 76, improvement: 1, comment: '注意力集中度需提高' }
    ]);
    
    const trainingTips = ref([
      { title: '提高稳定性', type: 'success', description: '根据您的最近表现，建议增加核心力量训练，提高姿势稳定性。' },
      { title: '释放一致性', type: 'info', description: '您的射箭释放动作略有波动，可以进行更多的重复性训练来增强肌肉记忆。' },
      { title: '装备调整', type: 'warning', description: '您的设备可能需要微调，特别是弓弦张力和箭的平衡，以提高整体精度。' }
    ]);
    
    // 方法
    const viewAllTrainings = () => {
      // 切换到训练计划页面
      window.location.hash = 'training';
    };
    
    const viewTrainingDetail = (training) => {
      ElementPlus.ElMessageBox.alert(
        `训练日期: ${training.date}<br/>
        训练时长: ${training.duration}<br/>
        训练类型: ${training.type}<br/>
        得分: ${training.score}<br/>
        进步: ${training.improvement}%<br/>
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
    
    const getScoreClass = (score) => {
      if (score >= 90) return 'text-success font-bold';
      if (score >= 80) return 'text-primary font-bold';
      if (score >= 70) return 'text-warning font-bold';
      return 'text-danger font-bold';
    };
    
    const getImprovementClass = (improvement) => {
      if (improvement > 0) return 'text-success';
      if (improvement < 0) return 'text-danger';
      return 'text-gray-500';
    };
    
    // 初始化图表
    const initCharts = () => {
      // 训练进度图表
      if (window.echarts && trainingProgressChart.value) {
        const chart = window.echarts.init(trainingProgressChart.value);
        const option = {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['得分', '平均水平']
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
            data: ['1周前', '6天前', '5天前', '4天前', '3天前', '2天前', '昨天']
          },
          yAxis: {
            type: 'value',
            min: 60,
            max: 100
          },
          series: [
            {
              name: '得分',
              type: 'line',
              data: [75, 78, 76, 82, 85, 83, 88],
              itemStyle: {
                color: '#1E4584'
              }
            },
            {
              name: '平均水平',
              type: 'line',
              data: [72, 72, 73, 74, 74, 75, 75],
              itemStyle: {
                color: '#FF6B35'
              },
              lineStyle: {
                type: 'dashed'
              }
            }
          ]
        };
        chart.setOption(option);
        
        // 窗口大小变化时重绘图表
        window.addEventListener('resize', () => {
          chart.resize();
        });
      }
      
      // 指标对比图表
      if (window.echarts && metricsChart.value) {
        const chart = window.echarts.init(metricsChart.value);
        const option = {
          radar: {
            indicator: [
              { name: '准确度', max: 100 },
              { name: '稳定性', max: 100 },
              { name: '一致性', max: 100 },
              { name: '力量', max: 100 },
              { name: '节奏', max: 100 }
            ]
          },
          series: [
            {
              type: 'radar',
              data: [
                {
                  value: [85, 78, 82, 90, 75],
                  name: '当前水平',
                  areaStyle: {
                    color: 'rgba(30, 69, 132, 0.2)'
                  },
                  lineStyle: {
                    color: '#1E4584'
                  },
                  itemStyle: {
                    color: '#1E4584'
                  }
                },
                {
                  value: [92, 85, 90, 93, 82],
                  name: '目标水平',
                  lineStyle: {
                    color: '#FF6B35',
                    type: 'dashed'
                  },
                  itemStyle: {
                    color: '#FF6B35'
                  }
                }
              ]
            }
          ]
        };
        chart.setOption(option);
        
        // 窗口大小变化时重绘图表
        window.addEventListener('resize', () => {
          chart.resize();
        });
      }
    };
    
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
      userName,
      timeRange,
      metricsType,
      stats,
      recentTrainings,
      trainingTips,
      trainingProgressChart,
      metricsChart,
      viewAllTrainings,
      viewTrainingDetail,
      viewVideoAnalysis,
      getScoreClass,
      getImprovementClass
    };
  }
};

// 注册组件
app.component('dashboard-component', DashboardComponent); 