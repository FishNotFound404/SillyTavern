use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::character::*;

pub struct CharacterRepository {
    pool: PgPool,
}

impl CharacterRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Character>, AppError> {
        let character = sqlx::query_as::<_, Character>(
            "SELECT * FROM characters WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(character)
    }

    pub async fn find_by_user_id(
        &self,
        user_id: Uuid,
        limit: i64,
        offset: i64,
        search: Option<&str>,
    ) -> Result<Vec<Character>, AppError> {
        let characters = match search {
            Some(search_term) => {
                let search_pattern = format!("%{}%", search_term);
                sqlx::query_as::<_, Character>(
                    r#"
                    SELECT * FROM characters
                    WHERE user_id = $1
                    AND (name ILIKE $2 OR description ILIKE $2)
                    ORDER BY updated_at DESC
                    LIMIT $3 OFFSET $4
                    "#,
                )
                .bind(user_id)
                .bind(search_pattern)
                .bind(limit)
                .bind(offset)
                .fetch_all(&self.pool)
                .await
            }
            None => {
                sqlx::query_as::<_, Character>(
                    r#"
                    SELECT * FROM characters
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
            }
        }
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(characters)
    }

    pub async fn create(
        &self,
        user_id: Uuid,
        input: CreateCharacterInput,
    ) -> Result<Character, AppError> {
        let world_info = input.world_info.unwrap_or(serde_json::json!({}));
        let metadata = input.metadata.unwrap_or(serde_json::json!({}));
        let tags = input.tags.unwrap_or_default();
        let is_public = input.is_public.unwrap_or(false);

        let character = sqlx::query_as::<_, Character>(
            r#"
            INSERT INTO characters (user_id, name, description, personality, scenario, first_message, avatar_url, world_info, metadata, is_public, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(input.name)
        .bind(input.description)
        .bind(input.personality)
        .bind(input.scenario)
        .bind(input.first_message)
        .bind(input.avatar_url)
        .bind(world_info)
        .bind(metadata)
        .bind(is_public)
        .bind(tags)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(character)
    }

    pub async fn update(
        &self,
        id: Uuid,
        input: UpdateCharacterInput,
    ) -> Result<Character, AppError> {
        let character = sqlx::query_as::<_, Character>(
            r#"
            UPDATE characters SET
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                personality = COALESCE($4, personality),
                scenario = COALESCE($5, scenario),
                first_message = COALESCE($6, first_message),
                avatar_url = COALESCE($7, avatar_url),
                world_info = COALESCE($8, world_info),
                metadata = COALESCE($9, metadata),
                is_public = COALESCE($10, is_public),
                tags = COALESCE($11, tags),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(input.name)
        .bind(input.description)
        .bind(input.personality)
        .bind(input.scenario)
        .bind(input.first_message)
        .bind(input.avatar_url)
        .bind(input.world_info)
        .bind(input.metadata)
        .bind(input.is_public)
        .bind(input.tags)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(character)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM characters WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }
}
