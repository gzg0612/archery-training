// 创建应用实例
const { createApp, ref, reactive, computed, onMounted } = Vue;

// 获取Element Plus组件
const { 
  ElMessage,
  ElMessageBox,
  ElLoading,
  ElNotification,
} = ElementPlus;

// 创建Vue应用
const app = createApp({
  setup() {
    // 应用状态
    const loading = ref(true);
    const isLoggedIn = ref(false); // 模拟未登录状态
    const currentPage = ref('login');
    const activeTab = ref('login');

    // 用户信息
    const userName = ref('张教练');
    const userAvatar = ref('./assets/images/avatar.png');

    // 登录表单
    const loginForm = reactive({
      username: '',
      password: '',
      remember: false
    });

    // 注册表单
    const registerForm = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreement: false
    });

    // 根据当前页面返回对应组件
    const currentComponent = computed(() => {
      switch(currentPage.value) {
        case 'dashboard':
          return 'dashboard-component';
        case 'training':
          return 'training-component';
        case 'analysis':
          return 'analysis-component';
        case 'profile':
          return 'profile-component';
        default:
          return 'dashboard-component';
      }
    });

    // 登录处理
    const handleLogin = () => {
      if (!loginForm.username || !loginForm.password) {
        ElMessage({
          message: '请输入用户名和密码',
          type: 'warning'
        });
        return;
      }
      
      loading.value = true;
      
      // 模拟登录API请求
      setTimeout(() => {
        isLoggedIn.value = true;
        currentPage.value = 'dashboard';
        loading.value = false;
        
        ElMessage({
          message: '登录成功！',
          type: 'success'
        });
      }, 1000);
    };

    // 注册处理
    const handleRegister = () => {
      // 表单验证
      if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
        ElMessage({
          message: '请填写所有必填字段',
          type: 'warning'
        });
        return;
      }
      
      if (registerForm.password !== registerForm.confirmPassword) {
        ElMessage({
          message: '两次输入的密码不一致',
          type: 'error'
        });
        return;
      }
      
      if (!registerForm.agreement) {
        ElMessage({
          message: '请阅读并同意使用条款和隐私政策',
          type: 'warning'
        });
        return;
      }
      
      loading.value = true;
      
      // 模拟注册API请求
      setTimeout(() => {
        activeTab.value = 'login';
        loading.value = false;
        
        // 自动填充登录表单
        loginForm.username = registerForm.username;
        loginForm.password = '';
        
        ElMessage({
          message: '注册成功！请登录',
          type: 'success'
        });
        
        // 重置注册表单
        registerForm.username = '';
        registerForm.email = '';
        registerForm.password = '';
        registerForm.confirmPassword = '';
        registerForm.agreement = false;
      }, 1000);
    };

    // 退出登录
    const logout = () => {
      ElMessageBox.confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        isLoggedIn.value = false;
        currentPage.value = 'login';
        activeTab.value = 'login';
        
        ElMessage({
          type: 'success',
          message: '已安全退出登录'
        });
      }).catch(() => {
        // 取消操作
      });
    };

    // 导航到个人资料页面
    const goToProfile = () => {
      currentPage.value = 'profile';
    };

    // 导航到系统设置页面
    const goToSettings = () => {
      // 暂未实现设置页面，提示用户
      ElMessage({
        message: '设置功能即将上线',
        type: 'info'
      });
    };

    // 初始化
    onMounted(() => {
      // 模拟加载过程
      setTimeout(() => {
        loading.value = false;
        
        // 检查是否有保存的登录状态（实际项目中会从localStorage或cookie中获取）
        const savedLoginState = localStorage.getItem('isLoggedIn');
        if (savedLoginState === 'true') {
          isLoggedIn.value = true;
          currentPage.value = 'dashboard';
        }
      }, 1500);
      
      // 监听hash变化以实现简单的路由
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash && isLoggedIn.value) {
          currentPage.value = hash;
        }
      });
    });

    // 返回到模板使用的数据和方法
    return {
      loading,
      isLoggedIn,
      currentPage,
      activeTab,
      userName,
      userAvatar,
      loginForm,
      registerForm,
      currentComponent,
      handleLogin,
      handleRegister,
      logout,
      goToProfile,
      goToSettings
    };
  }
});

// 挂载应用
app.mount('#app');

// 导出全局变量供其他脚本使用
window.appInstance = app; 