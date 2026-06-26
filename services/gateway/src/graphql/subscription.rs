use async_graphql::{Subscription, Context, Result, ID};
use futures_util::stream::Stream;
use tokio_stream::StreamExt;

use super::types::MessageStreamPayload;

pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    async fn message_stream(
        &self,
        _ctx: &Context<'_>,
        _conversation_id: ID,
    ) -> Result<impl Stream<Item = MessageStreamPayload>> {
        // TODO: Implement actual message streaming
        let stream = tokio_stream::iter(vec![
            MessageStreamPayload {
                chunk: Some("Hello".to_string()),
                done: false,
                message: None,
            },
            MessageStreamPayload {
                chunk: Some(" World".to_string()),
                done: false,
                message: None,
            },
            MessageStreamPayload {
                chunk: None,
                done: true,
                message: None,
            },
        ]);
        Ok(stream.throttle(std::time::Duration::from_millis(100)))
    }
}
