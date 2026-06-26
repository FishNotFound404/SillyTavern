use actix_web::dev::Payload;
use actix_web::{Error, FromRequest, HttpRequest};
use std::future::{ready, Ready};

#[allow(dead_code)]
pub struct AuthenticatedUser {
    pub user_id: String,
}

impl FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        // TODO: Implement actual JWT validation
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "));

        match token {
            Some(_token) => {
                // TODO: Validate JWT and extract user_id
                ready(Ok(AuthenticatedUser {
                    user_id: "placeholder".to_string(),
                }))
            }
            None => ready(Err(actix_web::error::ErrorUnauthorized("Missing token"))),
        }
    }
}
