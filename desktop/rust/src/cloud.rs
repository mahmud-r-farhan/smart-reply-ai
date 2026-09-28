use crate::heuristics::Suggestion;
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub name: String,
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: MessageContent,
}

#[derive(Deserialize)]
struct MessageContent {
    content: String,
}

pub struct CloudClient;

impl CloudClient {
    pub async fn complete(
        config: &ProviderConfig,
        prompt: &str,
        system_prompt: &str,
    ) -> Result<Vec<Suggestion>, Box<dyn std::error::Error + Send + Sync>> {
        let start = Instant::now();
        let client = reqwest::Client::new();
        let endpoint = format!("{}/chat/completions", config.base_url.trim_end_matches('/'));

        let body = ChatCompletionRequest {
            model: config.model.clone(),
            messages: vec![
                ChatMessage { role: "system".into(), content: system_prompt.into() },
                ChatMessage { role: "user".into(), content: prompt.into() },
            ],
            temperature: config.temperature.unwrap_or(0.7),
            max_tokens: config.max_tokens.unwrap_or(350),
        };

        let mut req = client.post(&endpoint).json(&body);
        if !config.api_key.trim().is_empty() {
            req = req.header("Authorization", format!("Bearer {}", config.api_key.trim()));
        }

        let resp = req.send().await?;
        let data: ChatCompletionResponse = resp.json().await?;
        let latency = start.elapsed().as_millis();

        if let Some(first_choice) = data.choices.first() {
            let content = first_choice.message.content.trim();
            // Parse JSON array
            if let Ok(list) = serde_json::from_str::<Vec<String>>(content) {
                let suggestions = list.into_iter().take(4).map(|text| Suggestion {
                    text,
                    source: "cloud-llm".into(),
                    latency_ms: latency,
                    confidence: 0.96,
                }).collect();
                return Ok(suggestions);
            }
        }

        Ok(vec![])
    }
}
