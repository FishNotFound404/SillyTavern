use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::world_info::*;

pub struct WorldInfoRepository {
    pool: PgPool,
}

impl WorldInfoRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_character_id(
        &self,
        character_id: Uuid,
    ) -> Result<Vec<WorldInfoEntry>, AppError> {
        let entries = sqlx::query_as::<_, WorldInfoEntry>(
            r#"
            SELECT * FROM world_info_entries
            WHERE character_id = $1
            ORDER BY order_index ASC, created_at ASC
            "#,
        )
        .bind(character_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(entries)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<WorldInfoEntry>, AppError> {
        let entry = sqlx::query_as::<_, WorldInfoEntry>(
            "SELECT * FROM world_info_entries WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(entry)
    }

    pub async fn create(
        &self,
        character_id: Uuid,
        input: CreateWorldInfoInput,
    ) -> Result<WorldInfoEntry, AppError> {
        let position = input.position.unwrap_or_else(|| "before_char".to_string());
        let order_index = input.order_index.unwrap_or(0);
        let enabled = input.enabled.unwrap_or(true);
        let selective = input.selective.unwrap_or(false);
        let secondary_keys = input.secondary_keys.unwrap_or_default();

        let entry = sqlx::query_as::<_, WorldInfoEntry>(
            r#"
            INSERT INTO world_info_entries (character_id, key, content, position, order_index, enabled, selective, secondary_keys, comment)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(character_id)
        .bind(input.key)
        .bind(input.content)
        .bind(position)
        .bind(order_index)
        .bind(enabled)
        .bind(selective)
        .bind(secondary_keys)
        .bind(input.comment)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(entry)
    }

    pub async fn update(
        &self,
        id: Uuid,
        input: UpdateWorldInfoInput,
    ) -> Result<WorldInfoEntry, AppError> {
        let entry = sqlx::query_as::<_, WorldInfoEntry>(
            r#"
            UPDATE world_info_entries SET
                key = COALESCE($2, key),
                content = COALESCE($3, content),
                position = COALESCE($4, position),
                order_index = COALESCE($5, order_index),
                enabled = COALESCE($6, enabled),
                selective = COALESCE($7, selective),
                secondary_keys = COALESCE($8, secondary_keys),
                comment = COALESCE($9, comment),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(input.key)
        .bind(input.content)
        .bind(input.position)
        .bind(input.order_index)
        .bind(input.enabled)
        .bind(input.selective)
        .bind(input.secondary_keys)
        .bind(input.comment)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(entry)
    }

    pub async fn delete(&self, id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query("DELETE FROM world_info_entries WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn reorder(
        &self,
        character_id: Uuid,
        entry_ids: Vec<Uuid>,
    ) -> Result<bool, AppError> {
        for (index, entry_id) in entry_ids.iter().enumerate() {
            sqlx::query(
                "UPDATE world_info_entries SET order_index = $1, updated_at = NOW() WHERE id = $2 AND character_id = $3",
            )
            .bind(index as i32)
            .bind(entry_id)
            .bind(character_id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        }

        Ok(true)
    }
}
