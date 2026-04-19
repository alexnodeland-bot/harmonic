use wasm_bindgen::prelude::*;
use harmonic_core::{Genome, GenomeEncoding, AudioAnalyzer};

#[wasm_bindgen]
pub fn synthesize_patch(patch_json: &str, duration: f32) -> Result<Vec<f32>, JsValue> {
    let patch: serde_json::Value = serde_json::from_str(patch_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let analyzer = AudioAnalyzer::new(44100.0, duration);
    let audio = analyzer.synthesize(&patch)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(audio)
}

#[wasm_bindgen]
pub fn analyze_patch(patch_json: &str, duration: f32) -> Result<String, JsValue> {
    let patch: serde_json::Value = serde_json::from_str(patch_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let analyzer = AudioAnalyzer::new(44100.0, duration);
    let audio = analyzer.synthesize(&patch)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let analysis = analyzer.analyze_spectrum(&audio);

    let result = serde_json::json!({
        "rms": analysis.rms,
        "centroid": analysis.centroid,
        "spectrum_peaks": analysis.spectrum.iter()
            .enumerate()
            .filter(|(_, v)| **v > 0.01)
            .map(|(i, v)| {
                let freq = i as f32 * (44100.0 / (analysis.spectrum.len() * 2) as f32);
                [freq, *v]
            })
            .collect::<Vec<_>>()
    });

    Ok(result.to_string())
}

#[wasm_bindgen]
pub fn create_random_patch() -> Result<String, JsValue> {
    let genome = Genome::random();
    genome.to_json_string()
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn mutate_patch(patch_json: &str) -> Result<String, JsValue> {
    let patch: serde_json::Value = serde_json::from_str(patch_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let mut genome = Genome::new(patch);
    genome.mutate(0.5);

    genome.to_json_string()
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
