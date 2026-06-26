use async_graphql::{Context, Object, Result, ID};

use super::types::{User, Character, Conversation, Message};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn me(&self, _ctx: &Context<'_>) -> Result<User> {
        // TODO: Implement actual user retrieval
        Err("Not implemented".into())
    }

    async fn characters(
        &self,
        _ctx: &Context<'_>,
        _limit: Option<i32>,
        _offset: Option<i32>,
        _search: Option<String>,
    ) -> Result<Vec<Character>> {
        // TODO: Implement actual character retrieval
        Ok(vec![])
    }

    async fn character(&self, _ctx: &Context<'_>, _id: ID) -> Result<Option<Character>> {
        // TODO: Implement actual character retrieval
        Ok(None)
    }

    async fn conversations(
        &self,
        _ctx: &Context<'_>,
        _limit: Option<i32>,
        _offset: Option<i32>,
    ) -> Result<Vec<Conversation>> {
        // TODO: Implement actual conversation retrieval
        Ok(vec![])
    }

    async fn conversation(&self, _ctx: &Context<'_>, _id: ID) -> Result<Option<Conversation>> {
        // TODO: Implement actual conversation retrieval
        Ok(None)
    }

    async fn messages(
        &self,
        _ctx: &Context<'_>,
        _conversation_id: ID,
        _limit: Option<i32>,
        _offset: Option<i32>,
    ) -> Result<Vec<Message>> {
        // TODO: Implement actual message retrieval
        Ok(vec![])
    }
}
