use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Suggestion {
    pub text: String,
    pub source: String,
    pub latency_ms: u128,
    pub confidence: f32,
}

pub struct HeuristicEngine;

impl HeuristicEngine {
    pub fn generate_replies(input: &str, tone: &str) -> Vec<Suggestion> {
        let start = Instant::now();
        let clean = input.trim();
        let lower = clean.to_lowercase();
        let norm_tone = tone.to_lowercase();

        let texts = if lower.contains("meet") || lower.contains("schedule") || lower.contains("call") {
            if norm_tone == "casual" || norm_tone == "friendly" {
                vec![
                    "Sounds good! Let me know what time works best for you. 😊".to_string(),
                    "Sure thing, shoot over a calendar invite!".to_string(),
                    "Down for a chat. When are you free this week?".to_string(),
                    "Count me in! Let me know when.".to_string(),
                ]
            } else {
                vec![
                    "I would be glad to meet. Please send over an invite with the agenda.".to_string(),
                    "That works for me. What time window suits your schedule best?".to_string(),
                    "I am available this week. Let me know which time slot works best.".to_string(),
                    "Let's sync up. Feel free to share your calendar link.".to_string(),
                ]
            }
        } else if lower.contains("thank") || lower.contains("thx") {
            if norm_tone == "casual" || norm_tone == "friendly" {
                vec![
                    "Anytime! Always happy to help! 😊".to_string(),
                    "You're so welcome! Let me know if you need anything else.".to_string(),
                    "Glad I could help out! Have an awesome day!".to_string(),
                    "No problem at all! 👍".to_string(),
                ]
            } else {
                vec![
                    "You are very welcome! Please let me know if you need anything else.".to_string(),
                    "Glad I could be of assistance. Don't hesitate to reach out.".to_string(),
                    "Happy to help! Looking forward to our continued collaboration.".to_string(),
                    "It was my pleasure. Wishing you the best with your next steps.".to_string(),
                ]
            }
        } else {
            vec![
                "Thank you for the detailed update. I will review and follow up shortly.".to_string(),
                "Acknowledged. That aligns well with our current roadmap.".to_string(),
                "Thank you for sharing this. Let's touch base on the next steps.".to_string(),
                "Understood. I will take the necessary action and keep you informed.".to_string(),
            ]
        };

        let latency = start.elapsed().as_millis();
        texts.into_iter().map(|text| Suggestion {
            text,
            source: "heuristic".to_string(),
            latency_ms: latency,
            confidence: 0.95,
        }).collect()
    }

    pub fn enhance_text(input: &str, _tone: &str) -> Vec<Suggestion> {
        let start = Instant::now();
        let mut clean = input.trim().to_string();
        if clean.is_empty() { return vec![]; }

        if let Some(first) = clean.chars().next() {
            clean.replace_range(0..1, &first.to_uppercase().to_string());
        }
        if !clean.ends_with('.') && !clean.ends_with('!') && !clean.ends_with('?') {
            clean.push('.');
        }

        let variations = vec![
            clean.clone(),
            format!("Please note: {} We appreciate your prompt attention.", clean),
            format!("Kindly be advised: {} Let me know if any questions arise.", clean),
            format!("Update: {}", clean),
        ];

        let latency = start.elapsed().as_millis();
        variations.into_iter().map(|text| Suggestion {
            text,
            source: "heuristic".to_string(),
            latency_ms: latency,
            confidence: 0.93,
        }).collect()
    }
}
