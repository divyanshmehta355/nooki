# Nooki Browser 🌿
> *“A little nook for the internet.”*

Nooki is a privacy-first, aesthetic desktop web browser for Windows built with **Tauri 2**, **Rust**, **React**, **TypeScript**, and **Microsoft WebView2**. It combines an ad- and tracker-blocking engine with a cozy visual identity inspired by cottagecore aesthetics, soft ivory tones, and daily rotating scenic landscape photography.

---

## Key Features

### 🛡️ High-Performance Ad & Tracker Blocking
- **Network Filtering Engine**: Written in Rust for maximum speed and memory efficiency.
- **Rule Syntax Support**:
  - Domain anchors (`||doubleclick.net^`)
  - Subdomain & path prefix matching (`||domain.com/ad_script.js^`)
  - Wildcards and regular expressions
  - Resource type classification (`script`, `image`, `stylesheet`, `xmlhttprequest`, `subdocument`, `ping`, `other`)
  - Third-party request detection (`$third-party`, `~third-party`)
  - Exception rules with strict override precedence (`@@||trusted.com^`)
- **Cosmetic Element Hiding**: Injects optimized DOM hiding rules (`##.ad-banner`, `##.cookie-banner`, `site.com##.sponsor`) to eliminate empty ad slots and prevent cumulative layout shift (CLS).
- **URL Tracking Sanitizer**: Automatically strips invasive tracking parameters (`utm_source`, `utm_medium`, `utm_campaign`, `fbclid`, `gclid`, `msclkid`, etc.) from navigated URLs.
- **Shield Dashboard Popover**: Live statistics of blocked ads, trackers, and hidden elements per tab and across the browsing session.
- **Site Whitelisting & Pause**: Easily toggle protection on/off for individual domains.
- **Filter List Management**: Pre-bundled with 4 curated lists for 100% offline out-of-the-box operation (Core Ads, Privacy & Anti-Tracker, Malicious & Phishing Guard, Cookie & Annoyance Blocker) with secure HTTPS update capabilities.

### 🌿 Cozy Visual Identity & Aesthetic Experience
- **Color Palette Tokens**:
  - *Light Mode*: Warm Ivory (`#F7F4ED`), Soft White (`#FFFEFA`), Oat Beige (`#EAE3D7`), Sage Mist (`#E5EEE5`), Nooki Green (`#28765F`), Forest Ink (`#243B33`), Muted Stone (`#777970`), Warm Amber (`#B87937`).
  - *Dark Mode*: Warm Forest Nocturne (`#202923`, `#29342D`, `#313D35`, `#91C5A5`).
- **Signature Cozy New Tab Page**:
  - Deterministic daily scenic landscape rotation.
  - Curated bundled landscapes: *Misty Forest Trail*, *Quiet Mountain Lake*, *Sunlit Wildflower Meadow*, *Rainy Cottage Window*, *Soft Sunrise Skies*, and *Gentle Autumn Scenery*.
  - Plain solid warm background fallback mode.
  - Large rounded cozy search input supporting DuckDuckGo, Brave, Google, and Ecosia.
  - Customizable website shortcuts with add and remove controls.
  - Date and time widget with time-of-day greeting.

### 🌐 Complete Browser Functionality
- **Multi-Tab Architecture**: Create (`Ctrl+T`), close (`Ctrl+W`), switch (`Ctrl+Tab`), and reopen recently closed tabs (`Ctrl+Shift+T`).
- **Navigation Controls**: Back (`Alt+Left`), Forward (`Alt+Right`), Reload/Stop (`Ctrl+R` / `F5`), and Home.
- **Cozy Pill Address Bar**: Automatic URL vs. search-query detection, lock security status, and instant star bookmarking (`Ctrl+D`).
- **Bookmarks Manager**: Quick-access bookmarks bar, search, folder structure, and creation/deletion.
- **Searchable Browsing History**: Grouped by timestamp, visit counts, search filter, and clear options (`Ctrl+H`).
- **Downloads Manager**: Status tracking, progress, open file, and clear completed (`Ctrl+J`).
- **Settings & Personalization**: Theme switching (Light, Dark, Windows System), accent colors, wallpaper gallery, default search engine, and clear browsing data.

---

## Architecture

```
nooki/
├── src/                          # React + TypeScript Frontend
│   ├── components/
│   │   ├── BookmarksBar.tsx      # Quick bookmarks bar
│   │   ├── BookmarksModal.tsx    # Bookmarks manager
│   │   ├── DownloadsModal.tsx    # Downloads tracking modal
│   │   ├── ErrorPage.tsx         # Cozy blocked / error page
│   │   ├── HistoryModal.tsx      # Searchable history modal
│   │   ├── NewTabPage.tsx        # Signature cozy new tab page
│   │   ├── NookiLogo.tsx         # Cozy sprout mascot
│   │   ├── SettingsModal.tsx     # Full settings & preferences modal
│   │   ├── ShieldPopover.tsx     # Ad-blocking dashboard popover
│   │   ├── TabBar.tsx            # Multi-tab strip
│   │   └── Toolbar.tsx           # Navigation & pill address bar
│   ├── services/
│   │   └── api.ts                # Typed Tauri IPC client
│   ├── styles/
│   │   ├── tokens.css            # Semantic design tokens
│   │   └── index.css             # Global typography & layout
│   ├── types/
│   │   └── browser.ts            # Core TypeScript interfaces
│   ├── App.tsx                   # Main browser shell
│   └── main.tsx                  # Application entrypoint
│
└── src-tauri/                    # Rust Native Backend
    ├── src/
    │   ├── browser/
    │   │   ├── bookmarks.rs      # JSON bookmark store
    │   │   ├── downloads.rs      # Downloads manager
    │   │   ├── history.rs        # Visit tracking & history store
    │   │   ├── tabs.rs           # BrowserTab state
    │   │   └── mod.rs            # BrowserState orchestrator
    │   ├── filtering/
    │   │   ├── filter_lists.rs   # Embedded & remote list manager
    │   │   ├── rules.rs          # Network/cosmetic rule parser & matcher
    │   │   ├── stats.rs          # Tab & session statistics tracker
    │   │   └── mod.rs            # AdBlockEngine core
    │   ├── settings/
    │   │   └── mod.rs            # Persistent UserSettings
    │   ├── wallpapers/
    │   │   └── mod.rs            # Curated scenic wallpapers & rotation
    │   ├── commands/
    │   │   └── mod.rs            # Tauri invoke handlers & child webviews
    │   └── lib.rs                # App entrypoint & automated test suite
    ├── Cargo.toml
    └── tauri.conf.json
```

---

## Windows Prerequisites

1. **Operating System**: Windows 10 (version 1809 or higher) or Windows 11.
2. **Microsoft Edge WebView2**: Pre-installed on Windows 11 and modern Windows 10 updates. (Evergreen runtime installed by default).
3. **Rust Toolchain**: Rust 1.78+ (tested on Rust 1.99+ with MSVC).
4. **Node.js**: Node 18+ (tested on Node v22.17+ with npm).
5. **C++ Build Tools**: Visual Studio 2022 C++ Build Tools or Windows SDK.

---

## Development & Build Instructions

### 1. Install Dependencies
```powershell
npm install
```

### 2. Run Tests
Execute the automated test suite verifying URL parsing, tab lifecycles, adblock engine matching, exception precedence, whitelisting, and settings persistence:
```powershell
cd src-tauri
cargo test -- --nocapture
cd ..
```

### 3. Run in Development Mode
Starts the Vite dev server and launches the Tauri desktop browser:
```powershell
npm run tauri dev
```

### 4. Build Release Binary
Builds the optimized production binary:
```powershell
npm run tauri build
```
The output executable will be generated at `src-tauri/target/release/nooki.exe`.

---

## Automated Test Results

The test suite runs 14 automated unit tests:
```text
running 14 tests
test filtering::rules::tests::test_cosmetic_rule_parse ... ok
test filtering::rules::tests::test_parse_exception_rule ... ok
test filtering::rules::tests::test_parse_domain_anchor ... ok
test filtering::rules::tests::test_third_party_option ... ok
test filtering::rules::tests::test_sanitize_tracking_params ... ok
test tests::test_url_vs_search_detection ... ok
test tests::test_daily_wallpaper_consistency ... ok
test tests::test_browser_state_init ... ok
test tests::test_engine_init ... ok
test tests::test_allow_rule_precedence_and_whitelisting ... ok
test tests::test_tab_lifecycle ... ok
test tests::test_browsing_data_clearing ... ok
test tests::test_filtering_statistics_tracking ... ok
test tests::test_settings_persistence ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; finished in 0.06s
```

---

## Privacy & Security Principles

- **Zero Telemetry**: Nooki transmits no browsing history, URLs, or search terms to any developer-controlled server.
- **Local-Only Storage**: Bookmarks, history, settings, and filter lists are stored in `%APPDATA%\Nooki\`.
- **Untrusted Web Isolation**: Web content runs in isolated child WebView2 instances with restricted capabilities, completely separated from native Rust IPC APIs.
- **HTTPS Filter Updates**: Remote filter lists are downloaded only via secure HTTPS, validated, and cached locally.
- **Clean Browsing Data Clearing**: Instant removal of browsing history, cache, and site cookies.

---

## License & Credits

Created for **Nooki Browser** — *A little nook for the internet*. Licensed under MIT.
Built with Tauri 2, Rust, React, Lucide Icons, and Microsoft WebView2.
