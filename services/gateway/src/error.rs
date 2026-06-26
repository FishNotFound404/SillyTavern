use actix_web::{HttpResponse, ResponseError};
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    DatabaseError(String),
    AuthenticationError(String),
    ValidationError(String),
    NotFound(String),
    InternalError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            AppError::AuthenticationError(msg) => write!(f, "Authentication error: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::DatabaseError(_) => HttpResponse::InternalServerError().json("Database error"),
            AppError::AuthenticationError(_) => HttpResponse::Unauthorized().json("Unauthorized"),
            AppError::ValidationError(_) => HttpResponse::BadRequest().json("Validation error"),
            AppError::NotFound(_) => HttpResponse::NotFound().json("Not found"),
            AppError::InternalError(_) => HttpResponse::InternalServerError().json("Internal error"),
        }
    }
}
