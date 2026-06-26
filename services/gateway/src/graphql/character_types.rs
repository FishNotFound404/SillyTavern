use async_graphql::*;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::models::character::Character as CharacterModel;
use crate::models::world_info::WorldInfoEntry as WorldInfoEntryModel;

#[derive(SimpleObject)]
pub struct Character {
    pub id: ID,
    pub user_id: ID,
    pub name: String,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub scenario: Option<String>,
    pub first_message: Option<String>,
    pub avatar_url: Option<String>,
    pub world_info: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub is_public: bool,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<CharacterModel> for Character {
    fn from(model: CharacterModel) -> Self {
        Self {
            id: model.id.into(),
            user_id: model.user_id.into(),
            name: model.name,
            description: model.description,
            personality: model.personality,
            scenario: model.scenario,
            first_message: model.first_message,
            avatar_url: model.avatar_url,
            world_info: Some(model.world_info),
            metadata: Some(model.metadata),
            is_public: model.is_public,
            tags: model.tags,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

#[derive(SimpleObject)]
pub struct WorldInfoEntry {
    pub id: ID,
    pub character_id: ID,
    pub key: String,
    pub content: String,
    pub position: String,
    pub order_index: i32,
    pub enabled: bool,
    pub selective: bool,
    pub secondary_keys: Vec<String>,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<WorldInfoEntryModel> for WorldInfoEntry {
    fn from(model: WorldInfoEntryModel) -> Self {
        Self {
            id: model.id.into(),
            character_id: model.character_id.into(),
            key: model.key,
            content: model.content,
            position: model.position,
            order_index: model.order_index,
            enabled: model.enabled,
            selective: model.selective,
            secondary_keys: model.secondary_keys,
            comment: model.comment,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}

#[derive(InputObject)]
pub struct CreateCharacterInput {
    pub name: String,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub scenario: Option<String>,
    pub first_message: Option<String>,
    pub avatar_url: Option<String>,
    pub world_info: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub is_public: Option<bool>,
    pub tags: Option<Vec<String>>,
}

#[derive(InputObject)]
pub struct UpdateCharacterInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub scenario: Option<String>,
    pub first_message: Option<String>,
    pub avatar_url: Option<String>,
    pub world_info: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub is_public: Option<bool>,
    pub tags: Option<Vec<String>>,
}

#[derive(InputObject)]
pub struct WorldInfoInput {
    pub key: String,
    pub content: String,
    pub position: Option<String>,
    pub order_index: Option<i32>,
    pub enabled: Option<bool>,
    pub selective: Option<bool>,
    pub secondary_keys: Option<Vec<String>>,
    pub comment: Option<String>,
}
