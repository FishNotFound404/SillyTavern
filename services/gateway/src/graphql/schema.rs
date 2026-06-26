use async_graphql::{Schema, EmptyMutation};
use super::query::QueryRoot;
use super::subscription::SubscriptionRoot;

pub type AppSchema = Schema<QueryRoot, EmptyMutation, SubscriptionRoot>;

pub fn create_schema() -> AppSchema {
    Schema::build(QueryRoot, EmptyMutation, SubscriptionRoot).finish()
}
