use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveLayoutSampleRequest {
    folder_path: String,
    sample_name: String,
    payload: Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SaveLayoutSampleResponse {
    file_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScanSampleDatabaseRequest {
    folder_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoadLayoutSampleRequest {
    file_path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LoadLayoutSampleResponse {
    file_path: String,
    payload: Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SampleDatabaseRecord {
    file_path: String,
    file_name: String,
    descriptor: Option<String>,
    packing_style: Option<String>,
    workflow_mode: Option<String>,
    created_at: Option<String>,
    pallet_width: Option<f64>,
    pallet_length: Option<f64>,
    carton_fingerprint: Option<String>,
    valid: bool,
    error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScanSampleDatabaseResponse {
    folder_path: String,
    total_files: usize,
    valid_files: usize,
    invalid_files: usize,
    samples: Vec<SampleDatabaseRecord>,
}

fn now_unix_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn is_windows_reserved_name(stem: &str) -> bool {
    let upper = stem.trim().to_ascii_uppercase();
    matches!(
        upper.as_str(),
        "CON"
            | "PRN"
            | "AUX"
            | "NUL"
            | "COM1"
            | "COM2"
            | "COM3"
            | "COM4"
            | "COM5"
            | "COM6"
            | "COM7"
            | "COM8"
            | "COM9"
            | "LPT1"
            | "LPT2"
            | "LPT3"
            | "LPT4"
            | "LPT5"
            | "LPT6"
            | "LPT7"
            | "LPT8"
            | "LPT9"
    )
}

fn sanitize_sample_stem(raw: &str) -> String {
    let mut normalized = String::with_capacity(raw.len());
    for ch in raw.chars() {
        let invalid = matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*');
        if invalid || ch.is_control() {
            normalized.push('-');
        } else {
            normalized.push(ch);
        }
    }

    let collapsed_ws = normalized
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("_")
        .trim_matches(|c: char| c == '.' || c == '_' || c == '-' || c.is_whitespace())
        .to_string();

    let fallback = format!("layout-sample-{}", now_unix_seconds());
    let candidate = if collapsed_ws.is_empty() {
        fallback
    } else {
        collapsed_ws
    };

    if is_windows_reserved_name(&candidate) {
        format!("sample-{}", candidate)
    } else {
        candidate
    }
}

fn unique_sample_path(folder: &Path, stem: &str) -> PathBuf {
    let mut candidate = folder.join(format!("{stem}.json"));
    if !candidate.exists() {
        return candidate;
    }

    let mut suffix: usize = 2;
    loop {
        candidate = folder.join(format!("{stem}-{suffix}.json"));
        if !candidate.exists() {
            return candidate;
        }
        suffix += 1;
    }
}

fn as_non_empty_string(value: Option<&Value>) -> Option<String> {
    value
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToOwned::to_owned)
}

fn extract_sample_meta(
    value: &Value,
) -> (
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>,
) {
    let object = value.as_object();
    let meta = object.and_then(|obj| obj.get("meta")).and_then(Value::as_object);
    let from_root = |key: &str| as_non_empty_string(object.and_then(|obj| obj.get(key)));
    let from_meta = |key: &str| as_non_empty_string(meta.and_then(|obj| obj.get(key)));

    let descriptor = from_root("descriptor").or_else(|| from_meta("descriptor"));
    let packing_style = from_root("packingStyle").or_else(|| from_meta("packingStyle"));
    let workflow_mode = from_root("workflowMode").or_else(|| from_meta("workflowMode"));
    let created_at = from_root("createdAt").or_else(|| from_meta("createdAt"));

    (descriptor, packing_style, workflow_mode, created_at)
}

fn value_as_f64(value: Option<&Value>) -> Option<f64> {
    value.and_then(|v| {
        v.as_f64()
            .or_else(|| v.as_i64().map(|n| n as f64))
            .or_else(|| v.as_u64().map(|n| n as f64))
    })
}

fn round_to(value: f64, digits: i32) -> f64 {
    let scale = 10_f64.powi(digits);
    (value * scale).round() / scale
}

fn extract_pallet_dimensions(value: &Value) -> (Option<f64>, Option<f64>) {
    let pallet = value.get("pallet").and_then(Value::as_object);
    let width = value_as_f64(pallet.and_then(|p| p.get("width"))).map(|v| round_to(v, 2));
    let length = value_as_f64(pallet.and_then(|p| p.get("length"))).map(|v| round_to(v, 2));
    (width, length)
}

fn extract_carton_fingerprint(value: &Value) -> Option<String> {
    let cartons = value.get("cartonTypes").and_then(Value::as_array)?;
    let mut parts: Vec<String> = Vec::new();

    for carton in cartons {
        let object = match carton.as_object() {
            Some(obj) => obj,
            None => continue,
        };

        let width = value_as_f64(object.get("width"));
        let length = value_as_f64(object.get("length"));
        let height = value_as_f64(object.get("height"));
        let weight = value_as_f64(object.get("weight"));
        if width.is_none() || length.is_none() || height.is_none() || weight.is_none() {
            continue;
        }

        let w = width.unwrap_or(0.0);
        let l = length.unwrap_or(0.0);
        let h = height.unwrap_or(0.0);
        let kg = weight.unwrap_or(0.0);
        let min_side = round_to(w.min(l), 2);
        let max_side = round_to(w.max(l), 2);
        let h_norm = round_to(h, 2);
        let kg_norm = round_to(kg, 3);
        let qty = value_as_f64(object.get("quantity"))
            .map(|v| v.max(0.0).floor() as u64)
            .unwrap_or(0);

        parts.push(format!(
            "{min_side:.2}x{max_side:.2}x{h_norm:.2}@{kg_norm:.3}#{qty}"
        ));
    }

    if parts.is_empty() {
        return None;
    }
    parts.sort();
    Some(parts.join("|"))
}

fn matches_sample_schema(value: &Value) -> bool {
    value
        .get("schemaVersion")
        .and_then(Value::as_u64)
        .is_some()
        && value.get("pallet").map(Value::is_object).unwrap_or(false)
        && value.get("placements").map(Value::is_array).unwrap_or(false)
}

fn collect_json_files_recursive(root: &Path, out: &mut Vec<PathBuf>) -> Result<(), String> {
    let entries = fs::read_dir(root)
        .map_err(|e| format!("Failed to read directory '{}': {e}", root.display()))?;

    for entry_result in entries {
        let entry = entry_result
            .map_err(|e| format!("Failed to read directory entry in '{}': {e}", root.display()))?;
        let path = entry.path();
        let file_type = entry
            .file_type()
            .map_err(|e| format!("Failed to inspect '{}': {e}", path.display()))?;

        if file_type.is_dir() {
            collect_json_files_recursive(&path, out)?;
            continue;
        }
        if !file_type.is_file() {
            continue;
        }

        let is_json = path
            .extension()
            .and_then(OsStr::to_str)
            .map(|ext| ext.eq_ignore_ascii_case("json"))
            .unwrap_or(false);
        if is_json {
            out.push(path);
        }
    }

    Ok(())
}

#[tauri::command]
fn save_layout_sample(request: SaveLayoutSampleRequest) -> Result<SaveLayoutSampleResponse, String> {
    let folder_path = request.folder_path.trim();
    if folder_path.is_empty() {
        return Err("Sample folder path is empty.".to_string());
    }

    let folder = PathBuf::from(folder_path);
    if !folder.exists() || !folder.is_dir() {
        return Err(format!(
            "Selected sample folder does not exist or is not a directory: {}",
            folder.display()
        ));
    }

    let descriptor_fallback = extract_sample_meta(&request.payload).0;
    let requested_name = request.sample_name.trim();
    let resolved_name = if requested_name.is_empty() {
        descriptor_fallback.unwrap_or_else(|| format!("layout-sample-{}", now_unix_seconds()))
    } else {
        requested_name.to_string()
    };
    let file_stem = sanitize_sample_stem(&resolved_name);
    let destination = unique_sample_path(&folder, &file_stem);

    let serialized = serde_json::to_string_pretty(&request.payload)
        .map_err(|e| format!("Failed to serialize sample payload: {e}"))?;
    fs::write(&destination, format!("{serialized}\n"))
        .map_err(|e| format!("Failed to write sample file '{}': {e}", destination.display()))?;

    Ok(SaveLayoutSampleResponse {
        file_path: destination.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn load_layout_sample(request: LoadLayoutSampleRequest) -> Result<LoadLayoutSampleResponse, String> {
    let file_path = request.file_path.trim();
    if file_path.is_empty() {
        return Err("Sample file path is empty.".to_string());
    }

    let path = PathBuf::from(file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!(
            "Sample file does not exist or is not a regular file: {}",
            path.display()
        ));
    }

    let is_json = path
        .extension()
        .and_then(OsStr::to_str)
        .map(|ext| ext.eq_ignore_ascii_case("json"))
        .unwrap_or(false);
    if !is_json {
        return Err(format!("Sample file is not a JSON file: {}", path.display()));
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read sample file '{}': {e}", path.display()))?;
    let payload: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Sample file is not valid JSON '{}': {e}", path.display()))?;
    if !matches_sample_schema(&payload) {
        return Err(format!(
            "Sample file has unrecognized schema (missing schemaVersion/pallet/placements): {}",
            path.display()
        ));
    }

    Ok(LoadLayoutSampleResponse {
        file_path: path.to_string_lossy().to_string(),
        payload,
    })
}

#[tauri::command]
fn scan_sample_database(
    request: ScanSampleDatabaseRequest,
) -> Result<ScanSampleDatabaseResponse, String> {
    let folder_path = request.folder_path.trim();
    if folder_path.is_empty() {
        return Err("Sample database folder path is empty.".to_string());
    }

    let folder = PathBuf::from(folder_path);
    if !folder.exists() || !folder.is_dir() {
        return Err(format!(
            "Selected sample database folder does not exist or is not a directory: {}",
            folder.display()
        ));
    }

    let mut json_files = Vec::<PathBuf>::new();
    collect_json_files_recursive(&folder, &mut json_files)?;
    json_files.sort_by(|a, b| a.to_string_lossy().cmp(&b.to_string_lossy()));

    let mut samples: Vec<SampleDatabaseRecord> = Vec::with_capacity(json_files.len());
    let mut valid_files = 0usize;
    let mut invalid_files = 0usize;

    for path in json_files {
        let file_name = path
            .file_name()
            .and_then(OsStr::to_str)
            .map(ToOwned::to_owned)
            .unwrap_or_else(|| "unknown.json".to_string());
        let file_path = path.to_string_lossy().to_string();

        match fs::read_to_string(&path) {
            Ok(content) => match serde_json::from_str::<Value>(&content) {
                Ok(value) => {
                    let (descriptor, packing_style, workflow_mode, created_at) =
                        extract_sample_meta(&value);
                    let (pallet_width, pallet_length) = extract_pallet_dimensions(&value);
                    let carton_fingerprint = extract_carton_fingerprint(&value);
                    let valid = matches_sample_schema(&value);
                    if valid {
                        valid_files += 1;
                    } else {
                        invalid_files += 1;
                    }

                    samples.push(SampleDatabaseRecord {
                        file_path,
                        file_name,
                        descriptor,
                        packing_style,
                        workflow_mode,
                        created_at,
                        pallet_width,
                        pallet_length,
                        carton_fingerprint,
                        valid,
                        error: if valid {
                            None
                        } else {
                            Some("JSON parsed, but sample schema is not recognized.".to_string())
                        },
                    });
                }
                Err(e) => {
                    invalid_files += 1;
                    samples.push(SampleDatabaseRecord {
                        file_path,
                        file_name,
                        descriptor: None,
                        packing_style: None,
                        workflow_mode: None,
                        created_at: None,
                        pallet_width: None,
                        pallet_length: None,
                        carton_fingerprint: None,
                        valid: false,
                        error: Some(format!("Invalid JSON: {e}")),
                    });
                }
            },
            Err(e) => {
                invalid_files += 1;
                samples.push(SampleDatabaseRecord {
                    file_path,
                    file_name,
                    descriptor: None,
                    packing_style: None,
                    workflow_mode: None,
                    created_at: None,
                    pallet_width: None,
                    pallet_length: None,
                    carton_fingerprint: None,
                    valid: false,
                    error: Some(format!("Unable to read file: {e}")),
                });
            }
        }
    }

    Ok(ScanSampleDatabaseResponse {
        folder_path: folder.to_string_lossy().to_string(),
        total_files: valid_files + invalid_files,
        valid_files,
        invalid_files,
        samples,
    })
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_layout_sample,
            load_layout_sample,
            scan_sample_database
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
