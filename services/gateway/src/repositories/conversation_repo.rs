use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::conversation::*;

pub struct ConversationRepository {
    pool: PgPool,
}

impl ConversationRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Conversation>, AppError> {
        let conversation = sqlx::query_as::<_, Conversation>(
            "SELECT * FROM conversations WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(conversation)
    }

    pub async fn find_by_user_id(
        &self,
        user_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Conversation>, AppError> {
        let conversations = sqlx::query_as::<_, Conversation>(
            r#"
            SELECT * FROM conversations
            WHERE user_id = $1
            ORDER BY updated_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(conversations)
    }

    pub async fn create(
        &self,
        user_id: Uuid,
        input: CreateConversationInput,
    ) -> Result<Conversation, AppError> {
        let conversation = sqlx::query_as::<_, Conversation>(
            r#"
            INSERT INTO conversations (user_id, character_id, title, model, provider)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(input.character_id)
        .bind(input.title)
        .bind(input.model)
        .bind(input.provider)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(conversation)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM conversations WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }
}
