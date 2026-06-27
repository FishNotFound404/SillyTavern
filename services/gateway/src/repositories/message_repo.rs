use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::message::*;

pub struct MessageRepository {
    pool: PgPool,
}

impl MessageRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_conversation_id(
        &self,
        conversation_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Message>, AppError> {
        let messages = sqlx::query_as::<_, Message>(
            r#"
            SELECT * FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at ASC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(conversation_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(messages)
    }

    pub async fn create(
        &self,
        conversation_id: Uuid,
        input: CreateMessageInput,
    ) -> Result<Message, AppError> {
        let message = sqlx::query_as::<_, Message>(
            r#"
            INSERT INTO messages (conversation_id, role, content, model)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(conversation_id)
        .bind(input.role)
        .bind(input.content)
        .bind(input.model)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(message)
    }
}
