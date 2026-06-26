use async_graphql::{Schema, EmptyMutation, EmptySubscription};
use super::query::QueryRoot;

pub type AppSchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

pub fn create_schema() -> AppSchema {
    Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish()
}
