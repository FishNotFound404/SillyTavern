use async_graphql::{Schema, EmptySubscription};
use super::query::QueryRoot;
use super::character_queries::CharacterQueries;
use super::character_mutations::CharacterMutations;

pub type AppSchema = Schema<QueryRoot, CharacterMutations, EmptySubscription>;

pub fn create_schema() -> AppSchema {
    Schema::build(QueryRoot, CharacterMutations, EmptySubscription).finish()
}
