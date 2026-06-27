use async_graphql::{Schema, EmptySubscription, MergedObject};
use super::query::QueryRoot;
use super::character_mutations::CharacterMutations;
use super::chat_mutations::ChatMutations;

#[derive(MergedObject)]
pub struct Mutations(pub CharacterMutations, pub ChatMutations);

pub type AppSchema = Schema<QueryRoot, Mutations, EmptySubscription>;

pub fn create_schema() -> AppSchema {
    Schema::build(QueryRoot, Mutations(CharacterMutations, ChatMutations), EmptySubscription).finish()
}
