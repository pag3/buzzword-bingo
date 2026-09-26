// Desktop shell for the static game in dist/, which Tauri embeds into the
// binary at build time so the app runs fully offline.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
