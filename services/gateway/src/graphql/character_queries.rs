use async_graphql::*;
use uuid::Uuid;
use crate::state::AppState;
use super::character_types::*;
use crate::repositories::character_repo::CharacterRepository;
use crate::repositories::world_info_repo::WorldInfoRepository;

pub struct CharacterQueries;

#[Object]
impl CharacterQueries {
    async fn characters(
        &self,
        ctx: &Context<'_>,
        limit: Option<i64>,
        offset: Option<i64>,
        search: Option<String>,
        user_id: Option<ID>,
    ) -> Result<Vec<Character>> {
        let state = ctx.data::<AppState>()?;
        let repo = CharacterRepository::new(state.db_pool.clone());

        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        let user_id = user_id
            .map(|id| Uuid::parse_str(&id).map_err(|_| "Invalid user ID"))
            .transpose()?
            .unwrap_or_else(|| Uuid::nil());

        let characters = repo.find_by_user_id(user_id, limit, offset, search.as_deref()).await?;

        Ok(characters.into_iter().map(Character::from).collect())
    }

    async fn character(&self, ctx: &Context<'_>, id: ID) -> Result<Option<Character>> {
        let state = ctx.data::<AppState>()?;
        let repo = CharacterRepository::new(state.db_pool.clone());

        let character_id = Uuid::parse_str(&id).map_err(|_| "Invalid character ID")?;
        let character = repo.find_by_id(character_id).await?;

        Ok(character.map(Character::from))
    }

    async fn world_info_entries(&self, ctx: &Context<'_>, character_id: ID) -> Result<Vec<WorldInfoEntry>> {
        let state = ctx.data::<AppState>()?;
        let repo = WorldInfoRepository::new(state.db_pool.clone());

        let char_id = Uuid::parse_str(&character_id).map_err(|_| "Invalid character ID")?;
        let entries = repo.find_by_character_id(char_id).await?;

        Ok(entries.into_iter().map(WorldInfoEntry::from).collect())
    }
}
