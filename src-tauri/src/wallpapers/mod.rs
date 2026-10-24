use chrono::{Datelike, Local};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenicWallpaper {
    pub id: String,
    pub title: String,
    pub description: String,
    pub location: String,
    pub image_path: String,
    pub photographer: String,
    pub warm_tint: String,
}

pub fn get_curated_wallpapers() -> Vec<ScenicWallpaper> {
    vec![
        ScenicWallpaper {
            id: "misty-forest".to_string(),
            title: "Misty Forest Trail".to_string(),
            description: "Soft morning dew and quiet fog resting between mossy pine trunks.".to_string(),
            location: "Black Forest, Germany".to_string(),
            image_path: "/wallpapers/misty-forest.svg".to_string(),
            photographer: "Nooki Scenery".to_string(),
            warm_tint: "rgba(36, 59, 51, 0.45)".to_string(),
        },
        ScenicWallpaper {
            id: "mountain-lake".to_string(),
            title: "Quiet Mountain Lake".to_string(),
            description: "Still crystal waters mirroring snow-dusted alpine ridges at dawn.".to_string(),
            location: "Lake Braies, Dolomites".to_string(),
            image_path: "/wallpapers/mountain-lake.svg".to_string(),
            photographer: "Nooki Scenery".to_string(),
            warm_tint: "rgba(40, 70, 75, 0.40)".to_string(),
        },
        ScenicWallpaper {
            id: "sunlit-meadow".to_string(),
            title: "Sunlit Wildflower Meadow".to_string(),
            description: "Golden afternoon sunshine warming clover, daisies, and lavender.".to_string(),
            location: "Cotswolds, England".to_string(),
            image_path: "/wallpapers/sunlit-meadow.svg".to_string(),
            photographer: "Nooki Scenery".to_string(),
            warm_tint: "rgba(60, 50, 30, 0.35)".to_string(),
        },
        ScenicWallpaper {
            id: "rainy-cottage".to_string(),
            title: "Rainy Cottage Window".to_string(),
            description: "Gentle raindrops tracing patterns on glass overlooking a cozy tea garden.".to_string(),
            location: "Lakeside Cottage, Scotland".to_string(),
            image_path: "/wallpapers/rainy-cottage.svg".to_string(),
            photographer: "Nooki Scenery".to_string(),
            warm_tint: "rgba(35, 45, 42, 0.45)".to_string(),
        },
        ScenicWallpaper {
            id: "soft-sunrise".to_string(),
            title: "Soft Sunrise Skies".to_string(),
            description: "Gentle apricot and pastel rose glow rising above sleepy valley mist.".to_string(),
            location: "Val d'Orcia, Tuscany".to_string(),
            image_path: "/wallpapers/soft-sunrise.svg".to_string(),
            photographer: "Nooki Scenery".to_string(),
            warm_tint: "rgba(65, 45, 35, 0.35)".to_string(),
        },
        ScenicWallpaper {
            id: "autumn-scenery".to_string(),
            title: "Gentle Autumn Scenery".to_string(),
            description: "Warm amber oak foliage and crisp pine needles carpeted along a winding path.".to_string(),
            location: "Kyoto Gardens, Japan".to_string(),
            image_path: "/wallpapers/autumn-scenery.svg".to_string(),
            photographer: "Nooki Scenery".to_string(),
            warm_tint: "rgba(55, 40, 25, 0.40)".to_string(),
        },
    ]
}

/// Compute the daily wallpaper deterministically from today's calendar date.
pub fn get_daily_scenic_wallpaper() -> ScenicWallpaper {
    let list = get_curated_wallpapers();
    let today = Local::now().date_naive();
    let day_number = today.year() as u32 * 365 + today.ordinal();
    let idx = (day_number as usize) % list.len();
    list[idx].clone()
}
