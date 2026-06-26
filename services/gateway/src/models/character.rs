use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Character {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub scenario: Option<String>,
    pub first_message: Option<String>,
    pub avatar_url: Option<String>,
    pub world_info: serde_json::Value,
    pub metadata: serde_json::Value,
    pub is_public: bool,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCharacterInput {
    pub name: String,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub scenario: Option<String>,
    pub first_message: Option<String>,
    pub avatar_url: Option<String>,
    pub world_info: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub is_public: Option<bool>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCharacterInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub scenario: Option<String>,
    pub first_message: Option<String>,
    pub avatar_url: Option<String>,
    pub world_info: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub is_public: Option<bool>,
    pub tags: Option<Vec<String>>,
}
