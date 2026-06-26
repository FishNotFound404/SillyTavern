use async_graphql::{SimpleObject, Enum};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

#[derive(SimpleObject)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[allow(dead_code)]
#[derive(SimpleObject)]
pub struct AuthPayload {
    pub token: String,
    pub refresh_token: String,
    pub user: User,
}

#[derive(SimpleObject)]
pub struct Character {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub scenario: Option<String>,
    pub first_message: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_public: bool,
    pub tags: Vec<String>,
}

#[derive(SimpleObject)]
pub struct Conversation {
    pub id: Uuid,
    pub title: Option<String>,
    pub character: Option<Character>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub messages: Vec<Message>,
}

#[derive(SimpleObject)]
pub struct Message {
    pub id: Uuid,
    pub role: MessageRole,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub tokens_used: Option<i32>,
}

#[derive(SimpleObject)]
pub struct MessageStreamPayload {
    pub chunk: Option<String>,
    pub done: bool,
    pub message: Option<Message>,
}
