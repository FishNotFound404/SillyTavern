use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LLMConfig {
    pub id: Uuid,
    pub user_id: Uuid,
    pub provider: String,
    pub api_key_encrypted: Option<String>,
    pub model: String,
    pub base_url: Option<String>,
    pub settings: serde_json::Value,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLLMConfigInput {
    pub provider: String,
    pub api_key: Option<String>,
    pub model: String,
    pub base_url: Option<String>,
    pub settings: Option<serde_json::Value>,
    pub is_default: Option<bool>,
}
