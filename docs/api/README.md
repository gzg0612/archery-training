# API接口设计文档

## 1. API概述

### 1.1 基本信息
- 基础URL: `https://api.archery-training.com`
- API版本: v1
- 数据格式: JSON
- 认证方式: JWT Token

### 1.2 通用响应格式
```json
{
    "code": 0,           // 状态码，0表示成功
    "message": "success", // 状态信息
    "data": {}           // 响应数据
}
```

### 1.3 通用错误码
```json
{
    "10000": "系统错误",
    "10001": "参数错误",
    "10002": "未授权",
    "10003": "禁止访问",
    "10004": "资源不存在",
    "10005": "请求超时"
}
```

## 2. 用户相关接口

### 2.1 用户注册
```http
POST /api/v1/users/register

请求体：
{
    "username": "string",
    "email": "string",
    "password": "string",
    "full_name": "string",
    "phone": "string"
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "user_id": "string",
        "token": "string"
    }
}
```

### 2.2 用户登录
```http
POST /api/v1/users/login

请求体：
{
    "username": "string",
    "password": "string"
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "token": "string",
        "user_info": {
            "id": "string",
            "username": "string",
            "email": "string",
            "level": "string"
        }
    }
}
```

### 2.3 获取用户信息
```http
GET /api/v1/users/profile

请求头：
Authorization: Bearer {token}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "user_info": {
            "id": "string",
            "username": "string",
            "email": "string",
            "full_name": "string",
            "phone": "string",
            "level": "string",
            "created_at": "string"
        },
        "training_stats": {
            "total_sessions": 0,
            "average_score": 0,
            "best_score": 0
        }
    }
}
```

## 3. 训练计划相关接口

### 3.1 创建训练计划
```http
POST /api/v1/training-plans

请求头：
Authorization: Bearer {token}

请求体：
{
    "name": "string",
    "level": "string",
    "start_date": "string",
    "end_date": "string",
    "goals": {
        "target_score": 0,
        "training_frequency": 0,
        "focus_areas": ["string"]
    },
    "schedule": {
        "weekly_sessions": 0,
        "session_duration": 0
    }
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "plan_id": "string"
    }
}
```

### 3.2 获取训练计划列表
```http
GET /api/v1/training-plans

请求头：
Authorization: Bearer {token}

查询参数：
status: string (active/completed/all)
page: integer
page_size: integer

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 0,
        "plans": [{
            "id": "string",
            "name": "string",
            "level": "string",
            "start_date": "string",
            "end_date": "string",
            "status": "string",
            "progress": 0
        }]
    }
}
```

## 4. 视频分析相关接口

### 4.1 上传训练视频
```http
POST /api/v1/videos/upload

请求头：
Authorization: Bearer {token}
Content-Type: multipart/form-data

表单数据：
video: file
session_id: string

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "video_id": "string",
        "upload_url": "string"
    }
}
```

### 4.2 获取视频分析结果
```http
GET /api/v1/videos/{video_id}/analysis

请求头：
Authorization: Bearer {token}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "video_info": {
            "id": "string",
            "duration": 0,
            "created_at": "string"
        },
        "analysis_result": {
            "pose_data": {},
            "angles_data": {},
            "trajectory_data": {},
            "score": 0,
            "suggestions": ["string"]
        }
    }
}
```

### 4.3 实时视频分析
```http
WebSocket /api/v1/videos/realtime-analysis

连接参数：
token: string

发送消息格式：
{
    "type": "frame",
    "data": "base64_encoded_frame"
}

接收消息格式：
{
    "type": "analysis",
    "data": {
        "pose_data": {},
        "angles_data": {},
        "suggestions": ["string"]
    }
}
```

## 5. 箭靶分析相关接口

### 5.1 上传箭靶图片
```http
POST /api/v1/targets/upload

请求头：
Authorization: Bearer {token}
Content-Type: multipart/form-data

表单数据：
image: file
session_id: string

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "image_id": "string",
        "upload_url": "string"
    }
}
```

### 5.2 获取箭靶分析结果
```http
GET /api/v1/targets/{image_id}/analysis

请求头：
Authorization: Bearer {token}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "scores": [0],
        "distribution_data": {
            "center_x": 0,
            "center_y": 0,
            "radius": 0,
            "points": [{
                "x": 0,
                "y": 0,
                "score": 0
            }]
        },
        "average_score": 0,
        "grouping_size": 0
    }
}
```

## 6. 训练会话相关接口

### 6.1 创建训练会话
```http
POST /api/v1/training-sessions

请求头：
Authorization: Bearer {token}

请求体：
{
    "plan_id": "string",
    "date": "string",
    "distance": 0,
    "arrows_count": 0,
    "weather_conditions": {
        "temperature": 0,
        "wind_speed": 0,
        "humidity": 0
    },
    "notes": "string"
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "session_id": "string"
    }
}
```

### 6.2 获取训练会话详情
```http
GET /api/v1/training-sessions/{session_id}

请求头：
Authorization: Bearer {token}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "session_info": {
            "id": "string",
            "date": "string",
            "distance": 0,
            "arrows_count": 0,
            "average_score": 0,
            "weather_conditions": {},
            "notes": "string"
        },
        "videos": [{
            "id": "string",
            "url": "string",
            "duration": 0,
            "analysis_status": "string"
        }],
        "targets": [{
            "id": "string",
            "url": "string",
            "analysis_status": "string"
        }]
    }
}
```

## 7. 数据统计相关接口

### 7.1 获取训练统计数据
```http
GET /api/v1/statistics/training

请求头：
Authorization: Bearer {token}

查询参数：
start_date: string
end_date: string
type: string (daily/weekly/monthly)

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "summary": {
            "total_sessions": 0,
            "total_arrows": 0,
            "average_score": 0,
            "best_score": 0
        },
        "trend": [{
            "date": "string",
            "score": 0,
            "arrows_count": 0
        }]
    }
}
```

### 7.2 获取进步报告
```http
GET /api/v1/statistics/progress

请求头：
Authorization: Bearer {token}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "score_progress": {
            "current": 0,
            "previous": 0,
            "improvement": 0
        },
        "technique_progress": {
            "posture_score": 0,
            "stability_score": 0,
            "consistency_score": 0
        },
        "recommendations": ["string"]
    }
}
```

## 8. 系统配置接口

### 8.1 获取系统配置
```http
GET /api/v1/system/config

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "version": "string",
        "supported_distances": [0],
        "supported_levels": ["string"],
        "upload_limits": {
            "video_size": 0,
            "image_size": 0
        }
    }
}
```

### 8.2 获取错误码说明
```http
GET /api/v1/system/error-codes

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "error_codes": {
            "10000": "系统错误",
            "10001": "参数错误"
        }
    }
}
```

## 9. API演进与版本控制

### 9.1 版本控制策略
```
URL路径版本控制: https://api.archery-training.com/api/v1/users
                https://api.archery-training.com/api/v2/users
```

### 9.2 API扩展计划

#### 9.2.1 用户服务API扩展
```http
# 密码重置
POST /api/v1/users/reset-password-request

请求体：
{
    "email": "string"
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "reset_code_expires_in": 900  // 15分钟过期
    }
}
```

```http
# 验证重置码
POST /api/v1/users/verify-reset-code

请求体：
{
    "email": "string",
    "reset_code": "string"
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "token": "string"  // 用于重置密码的临时令牌
    }
}
```

```http
# 完成密码重置
POST /api/v1/users/complete-password-reset

请求头：
Authorization: Bearer {token}  // 临时令牌

请求体：
{
    "new_password": "string"
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": null
}
```

```http
# 用户权限管理
GET /api/v1/users/{id}/permissions

请求头：
Authorization: Bearer {token}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "permissions": [
            {
                "resource": "string",
                "action": "string",
                "granted": true
            }
        ]
    }
}
```

```http
# 用户设置
GET /api/v1/users/settings

请求头：
Authorization: Bearer {token}

响应体：
{
    "code": 0,
    "message": "success",
    "data": {
        "settings": {
            "notification_preferences": {
                "email": true,
                "push": true
            },
            "privacy_settings": {
                "profile_visibility": "public",
                "share_statistics": true
            },
            "ui_preferences": {
                "theme": "light",
                "language": "zh_CN"
            }
        }
    }
}
```

```http
# 更新用户设置
PATCH /api/v1/users/settings

请求头：
Authorization: Bearer {token}

请求体：
{
    "settings": {
        "notification_preferences": {
            "email": false,
            "push": true
        }
    }
}

响应体：
{
    "code": 0,
    "message": "success",
    "data": null
}
```

### 9.3 API弃用政策

- 弃用通知：API弃用将提前3个月通知
- 过渡期：弃用后继续支持6个月
- 弃用标记：在API文档与响应头部添加弃用警告
- 迁移指南：为每个弃用的API提供迁移到新API的详细指南

```http
# 响应头示例
Deprecation: true
Sunset: Sat, 31 Dec 2023 23:59:59 GMT
Link: <https://api.archery-training.com/api/v2/users>; rel="successor-version"
``` 