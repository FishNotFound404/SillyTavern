use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatConfig {
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub content: String,
    pub tokens_used: u32,
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatChunk {
    pub content: String,
    pub done: bool,
}

#[derive(Debug, thiserror::Error)]
pub enum LLMError {
    #[error("API error: {0}")]
    APIError(String),
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("Config error: {0}")]
    ConfigError(String),
}

#[async_trait]
pub trait LLMProvider: Send + Sync {
    async fn chat(
        &self,
        messages: Vec<ChatMessage>,
        config: &ChatConfig,
    ) -> Result<ChatResponse, LLMError>;

    async fn chat_stream(
        &self,
        messages: Vec<ChatMessage>,
        config: &ChatConfig,
    ) -> Result<tokio::sync::mpsc::Receiver<ChatChunk>, LLMError>;
}
