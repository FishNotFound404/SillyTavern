use async_graphql::*;
use uuid::Uuid;
use crate::state::AppState;
use super::chat_types::*;
use crate::repositories::conversation_repo::ConversationRepository;
use crate::repositories::message_repo::MessageRepository;
use crate::repositories::llm_config_repo::LLMConfigRepository;

pub struct ChatMutations;

#[Object]
impl ChatMutations {
    async fn create_conversation(
        &self,
        ctx: &Context<'_>,
        input: CreateConversationInput,
    ) -> Result<Conversation> {
        let state = ctx.data::<AppState>()?;
        let repo = ConversationRepository::new(state.db_pool.clone());

        let user_id: Uuid = sqlx::query_as("SELECT id FROM users LIMIT 1")
            .fetch_one(&state.db_pool)
            .await
            .map(|row: (Uuid,)| row.0)
            .map_err(|e| format!("Failed to get user: {}", e))?;

        let create_input = crate::models::conversation::CreateConversationInput {
            character_id: input.character_id.map(|id| Uuid::parse_str(&id).unwrap()),
            title: input.title,
            model: input.model,
            provider: input.provider,
        };

        let conversation = repo.create(user_id, create_input).await?;

        Ok(Conversation::from(conversation))
    }

    async fn delete_conversation(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let state = ctx.data::<AppState>()?;
        let repo = ConversationRepository::new(state.db_pool.clone());

        let conversation_id = Uuid::parse_str(&id).map_err(|_| "Invalid conversation ID")?;
        let deleted = repo.delete(conversation_id).await?;

        Ok(deleted)
    }

    async fn send_message(
        &self,
        ctx: &Context<'_>,
        conversation_id: ID,
        content: String,
    ) -> Result<Message> {
        let state = ctx.data::<AppState>()?;
        let msg_repo = MessageRepository::new(state.db_pool.clone());
        let conv_repo = ConversationRepository::new(state.db_pool.clone());

        let conv_id = Uuid::parse_str(&conversation_id).map_err(|_| "Invalid conversation ID")?;

        let conversation = conv_repo.find_by_id(conv_id).await?
            .ok_or_else(|| "Conversation not found")?;

        let _user_msg = msg_repo.create(conv_id, crate::models::message::CreateMessageInput {
            role: "user".to_string(),
            content: content.clone(),
            model: None,
        }).await?;

        let assistant_msg = msg_repo.create(conv_id, crate::models::message::CreateMessageInput {
            role: "assistant".to_string(),
            content: "This is a placeholder response. LLM integration coming soon!".to_string(),
            model: conversation.model,
        }).await?;

        Ok(Message::from(assistant_msg))
    }

    async fn save_llm_config(
        &self,
        ctx: &Context<'_>,
        input: LLMConfigInput,
    ) -> Result<LLMConfig> {
        let state = ctx.data::<AppState>()?;
        let repo = LLMConfigRepository::new(state.db_pool.clone());

        let user_id: Uuid = sqlx::query_as("SELECT id FROM users LIMIT 1")
            .fetch_one(&state.db_pool)
            .await
            .map(|row: (Uuid,)| row.0)
            .map_err(|e| format!("Failed to get user: {}", e))?;

        let create_input = crate::models::llm_config::CreateLLMConfigInput {
            provider: input.provider,
            api_key: input.api_key,
            model: input.model,
            base_url: input.base_url,
            settings: None,
            is_default: input.is_default,
        };

        let config = repo.create(user_id, create_input).await?;

        Ok(LLMConfig::from(config))
    }

    async fn delete_llm_config(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let state = ctx.data::<AppState>()?;
        let repo = LLMConfigRepository::new(state.db_pool.clone());

        let config_id = Uuid::parse_str(&id).map_err(|_| "Invalid config ID")?;
        let deleted = repo.delete(config_id).await?;

        Ok(deleted)
    }
}
