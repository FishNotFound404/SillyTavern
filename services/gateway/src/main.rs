use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware};
use async_graphql_actix_web::{GraphQLRequest, GraphQLResponse, GraphQLSubscription};
use tracing_subscriber::EnvFilter;

mod config;
mod error;
mod graphql;
mod app_middleware;

use graphql::{AppSchema, create_schema};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    // Load configuration
    let config = config::Config::from_env().expect("Failed to load configuration");
    let addr = config.server_addr();

    tracing::info!("Starting server on {}", addr);

    // Create GraphQL schema
    let schema = create_schema();
    let enable_playground = config.enable_playground;

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        let mut app = App::new()
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .app_data(web::Data::new(schema.clone()))
            .service(
                web::resource("/graphql")
                    .route(web::post().to(graphql_handler))
                    .route(web::get().to(graphql_playground_handler))
            )
            .service(
                web::resource("/graphql/ws")
                    .route(web::get().to(graphql_ws_handler))
            )
            .route("/health", web::get().to(health_check));

        if enable_playground {
            app = app.service(
                web::resource("/graphql/playground")
                    .route(web::get().to(graphql_playground))
            );
        }

        app
    })
    .bind(&addr)?
    .run()
    .await
}

async fn graphql_handler(schema: web::Data<AppSchema>, req: GraphQLRequest) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

async fn graphql_playground_handler() -> actix_web::HttpResponse {
    actix_web::HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(async_graphql::http::playground_source(
            async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
        ))
}

async fn graphql_playground() -> actix_web::HttpResponse {
    actix_web::HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(async_graphql::http::playground_source(
            async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
        ))
}

async fn graphql_ws_handler(
    schema: web::Data<AppSchema>,
    req: actix_web::HttpRequest,
    payload: web::Payload,
) -> Result<actix_web::HttpResponse, actix_web::Error> {
    GraphQLSubscription::new(schema.get_ref().clone()).start(&req, payload)
}

async fn health_check() -> actix_web::HttpResponse {
    actix_web::HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
