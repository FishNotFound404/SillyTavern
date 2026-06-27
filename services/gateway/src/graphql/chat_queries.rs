use async_graphql::*;
use uuid::Uuid;
use crate::state::AppState;
use super::chat_types::*;
use crate::repositories::conversation_repo::ConversationRepository;
use crate::repositories::message_repo::MessageRepository;
use crate::repositories::llm_config_repo::LLMConfigRepository;

pub struct ChatQueries;

#[Object]
impl ChatQueries {
    async fn conversations(
        &self,
        ctx: &Context<'_>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<Conversation>> {
        let state = ctx.data::<AppState>()?;
        let repo = ConversationRepository::new(state.db_pool.clone());

        let user_id: Uuid = sqlx::query_as("SELECT id FROM users LIMIT 1")
            .fetch_one(&state.db_pool)
            .await
            .map(|row: (Uuid,)| row.0)
            .map_err(|e| format!("Failed to get user: {}", e))?;

        let conversations = repo.find_by_user_id(user_id, limit.unwrap_or(20), offset.unwrap_or(0)).await?;

        Ok(conversations.into_iter().map(Conversation::from).collect())
    }

    async fn conversation(&self, ctx: &Context<'_>, id: ID) -> Result<Option<Conversation>> {
        let state = ctx.data::<AppState>()?;
        let repo = ConversationRepository::new(state.db_pool.clone());

        let conversation_id = Uuid::parse_str(&id).map_err(|_| "Invalid conversation ID")?;
        let conversation = repo.find_by_id(conversation_id).await?;

        Ok(conversation.map(Conversation::from))
    }

    async fn messages(
        &self,
        ctx: &Context<'_>,
        conversation_id: ID,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<Message>> {
        let state = ctx.data::<AppState>()?;
        let repo = MessageRepository::new(state.db_pool.clone());

        let conv_id = Uuid::parse_str(&conversation_id).map_err(|_| "Invalid conversation ID")?;
        let messages = repo.find_by_conversation_id(conv_id, limit.unwrap_or(50), offset.unwrap_or(0)).await?;

        Ok(messages.into_iter().map(Message::from).collect())
    }

    async fn llm_configs(&self, ctx: &Context<'_>) -> Result<Vec<LLMConfig>> {
        let state = ctx.data::<AppState>()?;
        let repo = LLMConfigRepository::new(state.db_pool.clone());

        let user_id: Uuid = sqlx::query_as("SELECT id FROM users LIMIT 1")
            .fetch_one(&state.db_pool)
            .await
            .map(|row: (Uuid,)| row.0)
            .map_err(|e| format!("Failed to get user: {}", e))?;

        let configs = repo.find_by_user_id(user_id).await?;

        Ok(configs.into_iter().map(LLMConfig::from).collect())
    }
}
