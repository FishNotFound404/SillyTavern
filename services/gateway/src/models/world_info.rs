use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorldInfoEntry {
    pub id: Uuid,
    pub character_id: Uuid,
    pub key: String,
    pub content: String,
    pub position: String,
    pub order_index: i32,
    pub enabled: bool,
    pub selective: bool,
    pub secondary_keys: Vec<String>,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorldInfoInput {
    pub key: String,
    pub content: String,
    pub position: Option<String>,
    pub order_index: Option<i32>,
    pub enabled: Option<bool>,
    pub selective: Option<bool>,
    pub secondary_keys: Option<Vec<String>>,
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorldInfoInput {
    pub key: Option<String>,
    pub content: Option<String>,
    pub position: Option<String>,
    pub order_index: Option<i32>,
    pub enabled: Option<bool>,
    pub selective: Option<bool>,
    pub secondary_keys: Option<Vec<String>>,
    pub comment: Option<String>,
}
