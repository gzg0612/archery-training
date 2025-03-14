package model

import (
	"time"
)

// TrainingPlan 训练计划
type TrainingPlan struct {
	ID          int64      `json:"id" db:"id"`
	UserID      int64      `json:"user_id" db:"user_id"`
	Name        string     `json:"name" db:"name"`
	Description string     `json:"description" db:"description"`
	StartDate   time.Time  `json:"start_date" db:"start_date"`
	EndDate     time.Time  `json:"end_date" db:"end_date"`
	Status      string     `json:"status" db:"status"`
	Level       string     `json:"level" db:"level"`
	Type        string     `json:"type" db:"type"`
	Goals       []Goal     `json:"goals" db:"goals"`
	Items       []PlanItem `json:"items" db:"items"`
	Progress    float64    `json:"progress" db:"progress"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// Goal 训练目标
type Goal struct {
	ID          int64     `json:"id" db:"id"`
	PlanID      int64     `json:"plan_id" db:"plan_id"`
	Type        string    `json:"type" db:"type"`
	Target      float64   `json:"target" db:"target"`
	Current     float64   `json:"current" db:"current"`
	Description string    `json:"description" db:"description"`
	Deadline    time.Time `json:"deadline" db:"deadline"`
	Status      string    `json:"status" db:"status"`
}

// PlanItem 训练计划项
type PlanItem struct {
	ID          int64     `json:"id" db:"id"`
	PlanID      int64     `json:"plan_id" db:"plan_id"`
	Type        string    `json:"type" db:"type"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Duration    float64   `json:"duration" db:"duration"`
	Intensity   string    `json:"intensity" db:"intensity"`
	Date        time.Time `json:"date" db:"date"`
	Status      string    `json:"status" db:"status"`
	Notes       string    `json:"notes" db:"notes"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// TrainingPlanTemplate 训练计划模板
type TrainingPlanTemplate struct {
	ID          int64        `json:"id" db:"id"`
	Name        string       `json:"name" db:"name"`
	Description string       `json:"description" db:"description"`
	Level       string       `json:"level" db:"level"`
	Type        string       `json:"type" db:"type"`
	Duration    int          `json:"duration" db:"duration"` // 天数
	Goals       []GoalConfig `json:"goals" db:"goals"`
	Items       []ItemConfig `json:"items" db:"items"`
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at" db:"updated_at"`
}

// GoalConfig 目标配置
type GoalConfig struct {
	Type        string  `json:"type" db:"type"`
	Target      float64 `json:"target" db:"target"`
	Description string  `json:"description" db:"description"`
}

// ItemConfig 训练项配置
type ItemConfig struct {
	Type        string  `json:"type" db:"type"`
	Name        string  `json:"name" db:"name"`
	Description string  `json:"description" db:"description"`
	Duration    float64 `json:"duration" db:"duration"`
	Intensity   string  `json:"intensity" db:"intensity"`
	DayOffset   int     `json:"day_offset" db:"day_offset"`
}
