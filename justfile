#!/usr/bin/env just --justfile

# Harmonic - Audio Synthesis Patch Evolution

# Run all tests
test:
    cargo test --all --release

# Format code with rustfmt
fmt:
    cargo fmt --all

# Run clippy with strict lints
lint:
    cargo clippy --all-targets --all-features -- -D warnings

# Build release binaries
build:
    cargo build --all --release

# Build documentation
doc:
    cargo doc --no-deps --open

# Run full CI pipeline locally (format, lint, test, build)
ci: fmt lint test build
    @echo "✅ CI pipeline passed!"

# Build mdBook documentation
docs:
    cd docs && mdbook build

# Watch documentation builds
docs-watch:
    cd docs && mdbook watch

# Serve documentation locally
docs-serve:
    cd docs && mdbook serve

# Deploy to GitHub Pages (requires git setup)
deploy: docs
    git add docs/book
    git commit -m "docs: build mdbook documentation" || true
    git push origin main

# Clean build artifacts
clean:
    cargo clean

# Run CLI with example
run-cli:
    cargo run --release -p harmonic-cli --

# Default recipe
@default:
    just --list
