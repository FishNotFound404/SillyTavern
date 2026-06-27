use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Conversation {
    pub id: Uuid,
    pub user_id: Uuid,
    pub character_id: Option<Uuid>,
    pub title: Option<String>,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateConversationInput {
    pub character_id: Option<Uuid>,
    pub title: Option<String>,
    pub model: Option<String>,
    pub provider: Option<String>,
}
