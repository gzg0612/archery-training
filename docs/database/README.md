# 数据库设计文档

## 1. 数据库选型

### 1.1 主数据库 (PostgreSQL)
- 版本要求：15+
- 主要存储业务数据和关系数据
- 支持JSON类型，适合存储动态数据

### 1.2 缓存数据库 (Redis)
- 版本要求：7+
- 用于缓存和会话管理
- 支持发布订阅功能

### 1.3 对象存储 (MinIO)
- 用于存储视频、图片等大文件
- 支持分布式部署
- 兼容S3协议

## 2. 数据库表设计

### 2.1 用户相关表

#### users（用户表）
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    level VARCHAR(20) NOT NULL, -- 初级/中级/高级
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### user_profiles（用户档案表）
```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    height FLOAT,
    weight FLOAT,
    age INTEGER,
    experience_years FLOAT,
    preferred_distance INTEGER[], -- 训练距离偏好
    training_goals TEXT[],
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

### 2.2 训练相关表

#### training_plans（训练计划表）
```sql
CREATE TABLE training_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    goals JSONB,
    schedule JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX idx_training_plans_dates ON training_plans(start_date, end_date);
```

#### training_sessions（训练记录表）
```sql
CREATE TABLE training_sessions (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES training_plans(id),
    user_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    distance INTEGER NOT NULL,
    arrows_count INTEGER NOT NULL,
    average_score FLOAT,
    weather_conditions JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_training_sessions_plan_id ON training_sessions(plan_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(date);
```

### 2.3 视频分析相关表

#### video_records（视频记录表）
```sql
CREATE TABLE video_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id INTEGER REFERENCES training_sessions(id),
    video_url VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    format VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_records_user_id ON video_records(user_id);
CREATE INDEX idx_video_records_session_id ON video_records(session_id);
```

#### motion_analysis（动作分析表）
```sql
CREATE TABLE motion_analysis (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES video_records(id),
    pose_data JSONB NOT NULL,
    angles_data JSONB NOT NULL,
    trajectory_data JSONB NOT NULL,
    score FLOAT NOT NULL,
    suggestions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_motion_analysis_video_id ON motion_analysis(video_id);
```

### 2.4 箭靶分析相关表

#### target_images（箭靶图片表）
```sql
CREATE TABLE target_images (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES training_sessions(id),
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_target_images_session_id ON target_images(session_id);
```

#### target_analysis（箭靶分析表）
```sql
CREATE TABLE target_analysis (
    id SERIAL PRIMARY KEY,
    image_id INTEGER REFERENCES target_images(id),
    scores INTEGER[],
    distribution_data JSONB,
    average_score FLOAT,
    grouping_size FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_target_analysis_image_id ON target_analysis(image_id);
```

## 3. 数据访问层设计

### 3.1 实体定义
```go
// User 实体
type User struct {
    ID           int64     `json:"id"`
    Username     string    `json:"username"`
    Email        string    `json:"email"`
    PasswordHash string    `json:"-"`
    FullName     string    `json:"full_name"`
    Level        string    `json:"level"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
    LastLoginAt  time.Time `json:"last_login_at"`
    Status       string    `json:"status"`
}

// TrainingPlan 实体
type TrainingPlan struct {
    ID        int64           `json:"id"`
    UserID    int64           `json:"user_id"`
    Name      string          `json:"name"`
    Level     string          `json:"level"`
    StartDate time.Time       `json:"start_date"`
    EndDate   time.Time       `json:"end_date"`
    Status    string          `json:"status"`
    Goals     json.RawMessage `json:"goals"`
    Schedule  json.RawMessage `json:"schedule"`
    CreatedAt time.Time       `json:"created_at"`
    UpdatedAt time.Time       `json:"updated_at"`
}
```

### 3.2 数据访问接口
```go
// UserRepository 接口
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id int64) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, params *UserListParams) ([]*User, error)
}

// TrainingPlanRepository 接口
type TrainingPlanRepository interface {
    Create(ctx context.Context, plan *TrainingPlan) error
    GetByID(ctx context.Context, id int64) (*TrainingPlan, error)
    Update(ctx context.Context, plan *TrainingPlan) error
    Delete(ctx context.Context, id int64) error
    ListByUserID(ctx context.Context, userID int64) ([]*TrainingPlan, error)
}
```

## 4. 数据迁移策略

### 4.1 迁移工具
- 使用 golang-migrate 管理数据库迁移
- 版本控制迁移脚本
- 支持回滚操作

### 4.2 迁移流程
1. 创建迁移文件
2. 测试环境验证
3. 备份生产数据
4. 执行迁移
5. 验证迁移结果

## 5. 数据备份策略

### 5.1 常规备份
- 每日全量备份
- 实时增量备份
- 异地备份存储

### 5.2 备份内容
- 数据库完整备份
- 配置文件备份
- 媒体文件备份

## 6. 性能优化

### 6.1 索引优化
- 合理使用复合索引
- 定期维护索引
- 监控索引使用情况

### 6.2 查询优化
- 使用预编译语句
- 优化JOIN查询
- 合理使用子查询

### 6.3 配置优化
- 调整连接池
- 优化内存分配
- 配置查询缓存

## 7. 数据模型演进

### 7.1 用户数据模型扩展

#### 7.1.1 用户角色与权限表
```sql
-- 角色表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unique(user_id, role_id)
);

-- 权限表
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unique(resource, action)
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id),
    permission_id INTEGER REFERENCES permissions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unique(role_id, permission_id)
);
```

#### 7.1.2 用户设置表
```sql
-- 用户设置表
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "share_statistics": true}'::jsonb,
    ui_preferences JSONB DEFAULT '{"theme": "light", "language": "zh_CN"}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7.1.3 登录历史表
```sql
-- 登录历史表
CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    login_time TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info TEXT,
    login_status VARCHAR(20) NOT NULL,
    location TEXT
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_login_time ON login_history(login_time);
```

#### 7.1.4 密码重置表
```sql
-- 密码重置表
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
```

### 7.2 数据分库分表策略

#### 7.2.1 垂直分库
- **用户核心库**：用户基本信息、认证相关
- **用户档案库**：用户详细资料、设置、偏好
- **用户行为库**：登录历史、操作记录

#### 7.2.2 水平分表
用户相关表按照用户ID范围进行分片：

```
users_0000 - users_0999：用户ID 1-1,000,000
users_1000 - users_1999：用户ID 1,000,001-2,000,000
...
```

#### 7.2.3 分片键选择
- 主分片键：user_id
- 次分片键：created_at (时间范围分片)

### 7.3 数据库索引策略

#### 7.3.1 核心索引
```sql
-- 用户表索引优化
CREATE INDEX idx_users_username_email ON users(username, email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_level ON users(level);

-- 用户档案索引优化
CREATE INDEX idx_user_profiles_experience ON user_profiles(experience_years);
CREATE INDEX idx_user_profiles_preferred_distance ON user_profiles USING GIN(preferred_distance);

-- 登录历史索引优化
CREATE INDEX idx_login_history_composite ON login_history(user_id, login_time, login_status);
```

#### 7.3.2 索引维护计划
- 每周索引碎片整理
- 每月索引使用率分析
- 每季度索引优化调整 