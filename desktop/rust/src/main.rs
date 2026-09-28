mod heuristics;
mod cloud;

use heuristics::{HeuristicEngine, Suggestion};
use cloud::{CloudClient, ProviderConfig};
use tauri::{AppHandle, Manager};

#[tauri::command]
async fn generate_replies(
    input: String,
    tone: String,
    provider_config: Option<ProviderConfig>,
    mode: String,
) -> Result<Vec<Suggestion>, String> {
    // 1. Run local heuristic instantly (<1ms)
    let local = HeuristicEngine::generate_replies(&input, &tone);

    if mode == "offline" || provider_config.is_none() {
        return Ok(local);
    }

    if let Some(config) = provider_config {
        if !config.api_key.trim().is_empty() || config.base_url.contains("localhost") {
            let prompt = format!("Context: \"{}\"\nGenerate 4 short smart replies in \"{}\" tone as a JSON array of strings.", input, tone);
            if let Ok(cloud_results) = CloudClient::complete(&config, &prompt, "You are a smart conversational assistant.").await {
                if !cloud_results.is_empty() {
                    return Ok(cloud_results);
                }
            }
        }
    }

    Ok(local)
}

#[tauri::command]
fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            generate_replies,
            hide_overlay
        ])
        .setup(|app| {
            println!("[SmartReplyDesktop] Tauri v2 Core Initialized.");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
