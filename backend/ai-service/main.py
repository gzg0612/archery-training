#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
智能射箭训练AI服务主入口
"""

import os
import logging
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 导入各个模块的路由
from pose.router import router as pose_router
from motion.router import router as motion_router
from target.router import router as target_router
from recommendation.router import router as recommendation_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ai-service")

# 创建应用
app = FastAPI(
    title="智能射箭训练AI服务",
    description="提供姿态估计、动作分析、箭靶分析和建议生成服务",
    version="1.0.0",
)

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加路由
app.include_router(pose_router, prefix="/api/pose", tags=["姿态估计"])
app.include_router(motion_router, prefix="/api/motion", tags=["动作分析"])
app.include_router(target_router, prefix="/api/target", tags=["箭靶分析"])
app.include_router(recommendation_router, prefix="/api/recommendation", tags=["建议生成"])


class HealthResponse(BaseModel):
    status: str
    version: str


@app.get("/health", response_model=HealthResponse, tags=["健康检查"])
async def health_check():
    """
    健康检查接口
    """
    return {"status": "ok", "version": "1.0.0"}


@app.get("/", tags=["根路径"])
async def root():
    """
    根路径
    """
    return {
        "message": "欢迎使用智能射箭训练AI服务",
        "docs_url": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    # 获取端口
    port = int(os.environ.get("PORT", 5000))
    
    # 启动服务
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    ) 