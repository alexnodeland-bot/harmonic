/// TUI components for the harmonic CLI
/// This module provides terminal UI elements for displaying evolution progress
pub struct ProgressBar {
    current: u32,
    total: u32,
}

impl ProgressBar {
    #[allow(dead_code)]
    pub fn new(total: u32) -> Self {
        Self { current: 0, total }
    }

    #[allow(dead_code)]
    pub fn advance(&mut self) {
        self.current = self.current.saturating_add(1);
    }

    #[allow(dead_code)]
    pub fn render(&self) -> String {
        let bar_width = 40;
        let filled = (self.current as f32 / self.total as f32 * bar_width as f32) as usize;
        let empty = bar_width - filled;

        let bar = format!(
            "[{}{}] {}/{}",
            "=".repeat(filled),
            " ".repeat(empty),
            self.current,
            self.total
        );

        bar
    }
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct EvolutionDisplay {
    pub generation: u32,
    pub best_fitness: f32,
    pub avg_fitness: f32,
    pub improvement: f32,
}

impl EvolutionDisplay {
    #[allow(dead_code)]
    pub fn render(&self) -> String {
        format!(
            "Generation: {}\nBest: {:.4}\nAvg: {:.4}\nImprovement: {:.4}",
            self.generation, self.best_fitness, self.avg_fitness, self.improvement
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_progress_bar() {
        let mut pb = ProgressBar::new(100);
        pb.current = 50;
        let rendered = pb.render();
        assert!(rendered.contains("50/100"));
    }

    #[test]
    fn test_evolution_display() {
        let display = EvolutionDisplay {
            generation: 10,
            best_fitness: 0.75,
            avg_fitness: 0.60,
            improvement: 0.05,
        };
        let rendered = display.render();
        assert!(rendered.contains("10"));
    }
}
