use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use super::provider::*;

pub struct OpenAIProvider {
    client: Client,
    api_key: String,
    base_url: String,
}

impl OpenAIProvider {
    pub fn new(api_key: String, base_url: Option<String>) -> Self {
        Self {
            client: Client::new(),
            api_key,
            base_url: base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string()),
        }
    }
}

#[async_trait]
impl LLMProvider for OpenAIProvider {
    async fn chat(
        &self,
        messages: Vec<ChatMessage>,
        config: &ChatConfig,
    ) -> Result<ChatResponse, LLMError> {
        let url = format!("{}/chat/completions", self.base_url);
        
        let request = serde_json::json!({
            "model": config.model,
            "messages": messages,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
        });

        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| LLMError::NetworkError(e.to_string()))?;

        let body: serde_json::Value = response.json().await
            .map_err(|e| LLMError::NetworkError(e.to_string()))?;

        let content = body["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let tokens_used = body["usage"]["total_tokens"]
            .as_u64()
            .unwrap_or(0) as u32;

        Ok(ChatResponse {
            content,
            tokens_used,
            model: config.model.clone(),
        })
    }

    async fn chat_stream(
        &self,
        _messages: Vec<ChatMessage>,
        _config: &ChatConfig,
    ) -> Result<tokio::sync::mpsc::Receiver<ChatChunk>, LLMError> {
        // TODO: Implement streaming
        Err(LLMError::APIError("Streaming not yet implemented".to_string()))
    }
}
