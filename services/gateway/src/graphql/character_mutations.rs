use async_graphql::*;
use uuid::Uuid;
use crate::state::AppState;
use super::character_types::*;
use crate::repositories::character_repo::CharacterRepository;
use crate::repositories::world_info_repo::WorldInfoRepository;

pub struct CharacterMutations;

#[Object]
impl CharacterMutations {
    async fn create_character(
        &self,
        ctx: &Context<'_>,
        input: CreateCharacterInput,
    ) -> Result<Character> {
        let state = ctx.data::<AppState>()?;
        let repo = CharacterRepository::new(state.db_pool.clone());

        let user_id = Uuid::nil();

        let create_input = crate::models::character::CreateCharacterInput {
            name: input.name,
            description: input.description,
            personality: input.personality,
            scenario: input.scenario,
            first_message: input.first_message,
            avatar_url: input.avatar_url,
            world_info: input.world_info,
            metadata: input.metadata,
            is_public: input.is_public,
            tags: input.tags,
        };

        let character = repo.create(user_id, create_input).await?;

        Ok(Character::from(character))
    }

    async fn update_character(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: UpdateCharacterInput,
    ) -> Result<Character> {
        let state = ctx.data::<AppState>()?;
        let repo = CharacterRepository::new(state.db_pool.clone());

        let character_id = Uuid::parse_str(&id).map_err(|_| "Invalid character ID")?;

        let update_input = crate::models::character::UpdateCharacterInput {
            name: input.name,
            description: input.description,
            personality: input.personality,
            scenario: input.scenario,
            first_message: input.first_message,
            avatar_url: input.avatar_url,
            world_info: input.world_info,
            metadata: input.metadata,
            is_public: input.is_public,
            tags: input.tags,
        };

        let character = repo.update(character_id, update_input).await?;

        Ok(Character::from(character))
    }

    async fn delete_character(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let state = ctx.data::<AppState>()?;
        let repo = CharacterRepository::new(state.db_pool.clone());

        let character_id = Uuid::parse_str(&id).map_err(|_| "Invalid character ID")?;
        let deleted = repo.delete(character_id).await?;

        Ok(deleted)
    }

    async fn import_character(&self, ctx: &Context<'_>, data: String) -> Result<Character> {
        let state = ctx.data::<AppState>()?;
        let repo = CharacterRepository::new(state.db_pool.clone());

        let import_data: serde_json::Value = serde_json::from_str(&data)
            .map_err(|_| "Invalid JSON data")?;

        let name = import_data["name"].as_str()
            .ok_or_else(|| "Missing character name")?
            .to_string();

        let user_id = Uuid::nil();

        let create_input = crate::models::character::CreateCharacterInput {
            name,
            description: import_data["description"].as_str().map(|s| s.to_string()),
            personality: import_data["personality"].as_str().map(|s| s.to_string()),
            scenario: import_data["scenario"].as_str().map(|s| s.to_string()),
            first_message: import_data["first_message"].as_str().map(|s| s.to_string()),
            avatar_url: import_data["avatar"].as_str().map(|s| s.to_string()),
            world_info: import_data.get("world_info").cloned(),
            metadata: import_data.get("metadata").cloned(),
            is_public: Some(false),
            tags: import_data["tags"].as_array()
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()),
        };

        let character = repo.create(user_id, create_input).await?;

        Ok(Character::from(character))
    }

    async fn export_character(&self, ctx: &Context<'_>, id: ID) -> Result<String> {
        let state = ctx.data::<AppState>()?;
        let char_repo = CharacterRepository::new(state.db_pool.clone());
        let wi_repo = WorldInfoRepository::new(state.db_pool.clone());

        let character_id = Uuid::parse_str(&id).map_err(|_| "Invalid character ID")?;

        let character = char_repo.find_by_id(character_id).await?
            .ok_or_else(|| "Character not found")?;

        let world_info_entries = wi_repo.find_by_character_id(character_id).await?;

        let export_data = serde_json::json!({
            "name": character.name,
            "description": character.description,
            "personality": character.personality,
            "scenario": character.scenario,
            "first_message": character.first_message,
            "avatar": character.avatar_url,
            "world_info": world_info_entries.iter().map(|e| {
                serde_json::json!({
                    "key": e.key,
                    "content": e.content,
                    "position": e.position,
                    "order": e.order_index,
                    "enabled": e.enabled,
                    "selective": e.selective,
                    "secondary_keys": e.secondary_keys,
                    "comment": e.comment,
                })
            }).collect::<Vec<_>>(),
            "metadata": character.metadata,
            "tags": character.tags,
        });

        Ok(serde_json::to_string_pretty(&export_data)?)
    }

    async fn create_world_info_entry(
        &self,
        ctx: &Context<'_>,
        character_id: ID,
        input: WorldInfoInput,
    ) -> Result<WorldInfoEntry> {
        let state = ctx.data::<AppState>()?;
        let repo = WorldInfoRepository::new(state.db_pool.clone());

        let char_id = Uuid::parse_str(&character_id).map_err(|_| "Invalid character ID")?;

        let create_input = crate::models::world_info::CreateWorldInfoInput {
            key: input.key,
            content: input.content,
            position: input.position,
            order_index: input.order_index,
            enabled: input.enabled,
            selective: input.selective,
            secondary_keys: input.secondary_keys,
            comment: input.comment,
        };

        let entry = repo.create(char_id, create_input).await?;

        Ok(WorldInfoEntry::from(entry))
    }

    async fn update_world_info_entry(
        &self,
        ctx: &Context<'_>,
        id: ID,
        input: WorldInfoInput,
    ) -> Result<WorldInfoEntry> {
        let state = ctx.data::<AppState>()?;
        let repo = WorldInfoRepository::new(state.db_pool.clone());

        let entry_id = Uuid::parse_str(&id).map_err(|_| "Invalid entry ID")?;

        let update_input = crate::models::world_info::UpdateWorldInfoInput {
            key: Some(input.key),
            content: Some(input.content),
            position: input.position,
            order_index: input.order_index,
            enabled: input.enabled,
            selective: input.selective,
            secondary_keys: input.secondary_keys,
            comment: input.comment,
        };

        let entry = repo.update(entry_id, update_input).await?;

        Ok(WorldInfoEntry::from(entry))
    }

    async fn delete_world_info_entry(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let state = ctx.data::<AppState>()?;
        let repo = WorldInfoRepository::new(state.db_pool.clone());

        let entry_id = Uuid::parse_str(&id).map_err(|_| "Invalid entry ID")?;
        let deleted = repo.delete(entry_id).await?;

        Ok(deleted)
    }
}
