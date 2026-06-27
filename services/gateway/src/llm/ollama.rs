use async_trait::async_trait;
use reqwest::Client;
use super::provider::*;

pub struct OllamaProvider {
    client: Client,
    base_url: String,
}

impl OllamaProvider {
    pub fn new(base_url: Option<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.unwrap_or_else(|| "http://localhost:11434".to_string()),
        }
    }
}

#[async_trait]
impl LLMProvider for OllamaProvider {
    async fn chat(
        &self,
        messages: Vec<ChatMessage>,
        config: &ChatConfig,
    ) -> Result<ChatResponse, LLMError> {
        let url = format!("{}/api/chat", self.base_url);
        
        let request = serde_json::json!({
            "model": config.model,
            "messages": messages,
            "stream": false,
        });

        let response = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| LLMError::NetworkError(e.to_string()))?;

        let body: serde_json::Value = response.json().await
            .map_err(|e| LLMError::NetworkError(e.to_string()))?;

        let content = body["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let tokens_used = body["eval_count"]
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
