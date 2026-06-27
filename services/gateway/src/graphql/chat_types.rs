use async_graphql::*;
use chrono::{DateTime, Utc};
use crate::models::conversation::Conversation as ConversationModel;
use crate::models::message::Message as MessageModel;
use crate::models::llm_config::LLMConfig as LLMConfigModel;

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

#[derive(SimpleObject)]
pub struct Conversation {
    pub id: ID,
    pub user_id: ID,
    pub character_id: Option<ID>,
    pub title: Option<String>,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<ConversationModel> for Conversation {
    fn from(model: ConversationModel) -> Self {
        Self {
            id: model.id.into(),
            user_id: model.user_id.into(),
            character_id: model.character_id.map(|id| id.into()),
            title: model.title,
            model: model.model,
            provider: model.provider,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

#[derive(SimpleObject)]
pub struct Message {
    pub id: ID,
    pub conversation_id: ID,
    pub role: MessageRole,
    pub content: String,
    pub tokens_used: Option<i32>,
    pub model: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl From<MessageModel> for Message {
    fn from(model: MessageModel) -> Self {
        Self {
            id: model.id.into(),
            conversation_id: model.conversation_id.into(),
            role: match model.role.as_str() {
                "user" => MessageRole::User,
                "assistant" => MessageRole::Assistant,
                "system" => MessageRole::System,
                _ => MessageRole::User,
            },
            content: model.content,
            tokens_used: model.tokens_used,
            model: model.model,
            created_at: model.created_at,
        }
    }
}

#[derive(SimpleObject)]
pub struct LLMConfig {
    pub id: ID,
    pub user_id: ID,
    pub provider: String,
    pub model: String,
    pub base_url: Option<String>,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
}

impl From<LLMConfigModel> for LLMConfig {
    fn from(model: LLMConfigModel) -> Self {
        Self {
            id: model.id.into(),
            user_id: model.user_id.into(),
            provider: model.provider,
            model: model.model,
            base_url: model.base_url,
            is_default: model.is_default,
            created_at: model.created_at,
        }
    }
}

#[derive(SimpleObject)]
pub struct MessageStreamPayload {
    pub chunk: Option<String>,
    pub done: bool,
    pub message: Option<Message>,
}

#[derive(InputObject)]
pub struct CreateConversationInput {
    pub character_id: Option<ID>,
    pub title: Option<String>,
    pub model: Option<String>,
    pub provider: Option<String>,
}

#[derive(InputObject)]
pub struct LLMConfigInput {
    pub provider: String,
    pub api_key: Option<String>,
    pub model: String,
    pub base_url: Option<String>,
    pub is_default: Option<bool>,
}
