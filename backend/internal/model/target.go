package model

import (
	"time"
)

// Target 箭靶记录
type Target struct {
	ID         int64     `json:"id" db:"id"`
	TrainingID int64     `json:"training_id" db:"training_id"`
	UserID     int64     `json:"user_id" db:"user_id"`
	Image      string    `json:"image" db:"image"`
	Type       string    `json:"type" db:"type"`
	Distance   float64   `json:"distance" db:"distance"`
	Arrows     []Arrow   `json:"arrows" db:"arrows"`
	Score      int       `json:"score" db:"score"`
	Analysis   *Analysis `json:"analysis" db:"analysis"`
	Weather    *Weather  `json:"weather" db:"weather"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// Arrow 箭矢
type Arrow struct {
	ID       int64   `json:"id" db:"id"`
	TargetID int64   `json:"target_id" db:"target_id"`
	X        float64 `json:"x" db:"x"`
	Y        float64 `json:"y" db:"y"`
	Score    int     `json:"score" db:"score"`
	Ring     int     `json:"ring" db:"ring"`
	Color    string  `json:"color" db:"color"`
}

// Analysis 箭靶分析
type Analysis struct {
	Grouping        float64  `json:"grouping" db:"grouping"`               // 箭群紧密度
	CenterOffset    float64  `json:"center_offset" db:"center_offset"`     // 中心偏移
	Pattern         string   `json:"pattern" db:"pattern"`                 // 散布模式
	WindEffect      float64  `json:"wind_effect" db:"wind_effect"`         // 风力影响
	Consistency     float64  `json:"consistency" db:"consistency"`         // 一致性
	Recommendations []string `json:"recommendations" db:"recommendations"` // 改进建议
}

// Weather 天气条件
type Weather struct {
	Temperature float64 `json:"temperature" db:"temperature"` // 温度
	Humidity    float64 `json:"humidity" db:"humidity"`       // 湿度
	WindSpeed   float64 `json:"wind_speed" db:"wind_speed"`   // 风速
	WindDir     string  `json:"wind_dir" db:"wind_dir"`       // 风向
	Conditions  string  `json:"conditions" db:"conditions"`   // 天气状况
}

// TargetStatistics 箭靶统计
type TargetStatistics struct {
	UserID            int64       `json:"user_id" db:"user_id"`
	Period            string      `json:"period" db:"period"`
	StartDate         time.Time   `json:"start_date" db:"start_date"`
	EndDate           time.Time   `json:"end_date" db:"end_date"`
	TotalShots        int         `json:"total_shots" db:"total_shots"`
	TotalScore        int         `json:"total_score" db:"total_score"`
	AverageScore      float64     `json:"average_score" db:"average_score"`
	BestScore         int         `json:"best_score" db:"best_score"`
	AccuracyRate      float64     `json:"accuracy_rate" db:"accuracy_rate"`
	ConsistencyRate   float64     `json:"consistency_rate" db:"consistency_rate"`
	ImprovementRate   float64     `json:"improvement_rate" db:"improvement_rate"`
	ScoreDistribution map[int]int `json:"score_distribution" db:"score_distribution"`
}
