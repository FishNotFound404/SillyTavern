pub mod provider;
pub mod openai;
pub mod anthropic;
pub mod ollama;

use provider::LLMProvider;

pub fn create_provider(provider: &str, api_key: Option<String>, base_url: Option<String>) -> Box<dyn LLMProvider> {
    match provider {
        "openai" => Box::new(openai::OpenAIProvider::new(api_key.unwrap_or_default(), base_url)),
        "anthropic" => Box::new(anthropic::AnthropicProvider::new(api_key.unwrap_or_default(), base_url)),
        "ollama" => Box::new(ollama::OllamaProvider::new(base_url)),
        _ => panic!("Unknown provider: {}", provider),
    }
}
