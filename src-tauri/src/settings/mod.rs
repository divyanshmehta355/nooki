use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub theme: String, // "light", "dark", "system"
    pub accent_color: String, // "nova-green", "sage-mist", "warm-amber", "soft-rose", "sky-mist"
    pub wallpaper_mode: String, // "daily", "custom", "plain"
    pub selected_wallpaper_id: String,
    pub search_engine: String, // "duckduckgo", "brave", "google", "ecosia"
    pub startup_behavior: String, // "newtab", "restore"
    pub shield_enabled: bool,
    pub cosmetic_filtering_enabled: bool,
    pub strip_tracking_params: bool,
    pub clear_on_exit: bool,
    pub reduced_motion: bool,
    pub default_download_directory: String,
    pub restored_tabs: Vec<String>,
}

impl Default for UserSettings {
    fn default() -> Self {
        let download_dir = dirs::download_dir()
            .map(|d| d.to_string_lossy().to_string())
            .unwrap_or_else(|| "C:\\Downloads".to_string());

        Self {
            theme: "system".to_string(),
            accent_color: "nova-green".to_string(),
            wallpaper_mode: "daily".to_string(),
            selected_wallpaper_id: "misty-forest".to_string(),
            search_engine: "duckduckgo".to_string(),
            startup_behavior: "newtab".to_string(),
            shield_enabled: true,
            cosmetic_filtering_enabled: true,
            strip_tracking_params: true,
            clear_on_exit: false,
            reduced_motion: false,
            default_download_directory: download_dir,
            restored_tabs: vec!["nooki://newtab".to_string()],
        }
    }
}

pub struct SettingsManager {
    file_path: PathBuf,
    settings: RwLock<UserSettings>,
}

impl SettingsManager {
    pub fn new(app_data_dir: &Path) -> Self {
        let dir = app_data_dir.join("nooki");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("settings.json");

        let settings = if file_path.exists() {
            fs::read_to_string(&file_path)
                .ok()
                .and_then(|data| serde_json::from_str(&data).ok())
                .unwrap_or_default()
        } else {
            let def = UserSettings::default();
            if let Ok(data) = serde_json::to_string_pretty(&def) {
                let _ = fs::write(&file_path, data);
            }
            def
        };

        Self {
            file_path,
            settings: RwLock::new(settings),
        }
    }

    pub fn get(&self) -> UserSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update(&self, new_settings: UserSettings) -> std::io::Result<()> {
        {
            let mut s = self.settings.write().unwrap();
            *s = new_settings;
        }
        self.save()
    }

    pub fn save(&self) -> std::io::Result<()> {
        let s = self.settings.read().unwrap();
        let data = serde_json::to_string_pretty(&*s)?;
        fs::write(&self.file_path, data)
    }
}
