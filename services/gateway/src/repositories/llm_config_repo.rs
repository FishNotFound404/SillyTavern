use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::llm_config::*;

pub struct LLMConfigRepository {
    pool: PgPool,
}

impl LLMConfigRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<LLMConfig>, AppError> {
        let configs = sqlx::query_as::<_, LLMConfig>(
            r#"
            SELECT * FROM llm_configs
            WHERE user_id = $1
            ORDER BY is_default DESC, created_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(configs)
    }

    pub async fn create(
        &self,
        user_id: Uuid,
        input: CreateLLMConfigInput,
    ) -> Result<LLMConfig, AppError> {
        let settings = input.settings.unwrap_or(serde_json::json!({}));
        let is_default = input.is_default.unwrap_or(false);

        let config = sqlx::query_as::<_, LLMConfig>(
            r#"
            INSERT INTO llm_configs (user_id, provider, api_key_encrypted, model, base_url, settings, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(input.provider)
        .bind(input.api_key)
        .bind(input.model)
        .bind(input.base_url)
        .bind(settings)
        .bind(is_default)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(config)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM llm_configs WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }
}
