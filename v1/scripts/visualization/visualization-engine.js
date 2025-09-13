// ================================
// VISUALIZATION ENGINE
// ================================

class VisualizationEngine {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = {
            fadeWindowSeconds: 6.0,
            minAlpha: 0.15,
            fadeSharpness: 2.5,
            ...config
        };
        // Zoom / pan state
        this.scale = 1.0;
        this.panX = 0.0; // in world units (same units as positions)
        this.panY = 0.0;
        this.onViewChange = null; // callback to request a redraw

        // Drag state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Mouse-wheel zoom (zoom at cursor position)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const zoomFactor = Math.exp(-e.deltaY * 0.001); // smooth zoom
            this.zoomAt(mx, my, zoomFactor);
        }, { passive: false });

        // Drag-to-pan (mouse)
        this.canvas.style.cursor = 'grab';
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            // convert pixel delta to world units (inverse scale)
            this.panX += dx / this.scale;
            this.panY += dy / this.scale;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.requestRedraw();
        }, { passive: false });
        const endDrag = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        };
        window.addEventListener('mouseup', endDrag);
        this.canvas.addEventListener('mouseleave', (e) => {
            if (!this.isDragging) return;
            endDrag();
        });
    }

    // Allow external code to register a redraw callback
    setOnViewChange(cb) { this.onViewChange = cb; }
    requestRedraw() {
        if (typeof this.onViewChange === 'function') this.onViewChange();
    }

    // Reset zoom/pan to defaults
    resetView() {
        this.scale = 1.0;
        this.panX = 0.0;
        this.panY = 0.0;
        this.requestRedraw();
    }

    // Keep the world point under the cursor stationary while zooming
    zoomAt(canvasX, canvasY, factor) {
        const cx = this.canvas.width * 0.5;
        const cy = this.canvas.height * 0.5;
        // canvas -> current world (before zoom)
        const wx = (canvasX - cx) / this.scale - this.panX;
        const wy = (canvasY - cy) / this.scale - this.panY;
        // apply zoom
        const newScale = Math.max(0.2, Math.min(5.0, this.scale * factor));
        // solve pan' so that world point (wx,wy) maps back to (canvasX,canvasY)
        this.panX = (canvasX - cx) / newScale - wx;
        this.panY = (canvasY - cy) / newScale - wy;
        this.scale = newScale;
        this.requestRedraw();
    }

    // Attach double-click handler for reset
    initializeResetHandler() {
        this.canvas.addEventListener('dblclick', () => this.resetView());
    }

    fadeAlphaFromAge(ageSeconds) {
        if (ageSeconds <= 0) return 1.0;
        const base = Math.exp(-ageSeconds / this.config.fadeWindowSeconds);
        const shaped = Math.pow(base, this.config.fadeSharpness);
        return Math.max(this.config.minAlpha, shaped);
    }

    drawErrorEllipse(x, y, cov, confidence = 0.95) {
        if (!cov) return;
        const chi2 = 5.991; // 95% for 2D
        const a = cov[0][0], b = cov[0][1], c = cov[1][1];
        const trace = a + c;
        const det = a * c - b * b;
        const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det));
        const lambda1 = (trace + disc) / 2;
        const lambda2 = (trace - disc) / 2;
        const angle = Math.atan2(lambda1 - a, b);
        const width = 2 * Math.sqrt(Math.max(0, lambda1 * chi2));
        const height = 2 * Math.sqrt(Math.max(0, lambda2 * chi2));
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width, height, 0, 0, 2 * Math.PI);
        this.ctx.restore();
    }

    draw(data) {
        const { currentTime, dt, groundTruth, measurements, estimates, covariances } = data;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        // Apply view transform: center, then scale, then pan in world units
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(this.panX, this.panY);

        const timeIndex = Math.floor(currentTime / dt);

        // Ground truth trail
        this.ctx.globalAlpha = 0.3;
        this.ctx.strokeStyle = COLORS.GROUND_TRUTH;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        for (let i = 0; i <= timeIndex && i < groundTruth.length; i++) {
            const [x, y] = groundTruth[i];
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        // Historical estimates (only after init; entries can be null)
        for (let i = 0; i < timeIndex && i < estimates.length; i += 2) {
            const est = estimates[i];
            const cov = covariances[i];
            if (!est || !cov) continue;
            const t = i * dt;
            const age = currentTime - t;
            const a = this.fadeAlphaFromAge(age);

            // Historical ellipses (faded) – test inclusion
            let inside = true;
            if (est && cov && groundTruth[i]) {
                const dx = groundTruth[i][0] - est[0];
                const dy = groundTruth[i][1] - est[1];
                const Sinv = MatrixUtils.inverse2x2(cov);
                const d2 = dx*(Sinv[0][0]*dx + Sinv[0][1]*dy) +
                           dy*(Sinv[1][0]*dx + Sinv[1][1]*dy);
                inside = (d2 <= 5.991);
            }

            this.ctx.globalAlpha = a * 0.15;
            this.ctx.strokeStyle = inside ? 'rgba(0,255,255,1)' : 'rgba(255,80,80,1)';
            this.ctx.fillStyle   = inside ? 'rgba(0,255,255,1)' : 'rgba(255,80,80,1)';
            this.ctx.lineWidth = 1;
            this.drawErrorEllipse(est[0], est[1], cov);
            this.ctx.stroke();

            this.ctx.globalAlpha = a * 0.05;
            this.ctx.fill();

            this.ctx.globalAlpha = a * 0.5;
            this.ctx.fillStyle = COLORS.ESTIMATES;
            this.ctx.beginPath();
            this.ctx.arc(est[0], est[1], 2 / this.scale, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        // Measurements (faded)
        this.ctx.globalAlpha = 1.0;
        measurements.forEach(m => {
            if (m.time <= currentTime) {
                const age = currentTime - m.time;
                const a = this.fadeAlphaFromAge(age);
                this.ctx.globalAlpha = a;
                this.ctx.fillStyle = COLORS.MEASUREMENTS;
                this.ctx.beginPath();
                this.ctx.arc(m.pos[0], m.pos[1], 3 / this.scale, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        });

        // Current markers
        this.ctx.globalAlpha = 1.0;
        if (timeIndex < groundTruth.length) {
            this.ctx.fillStyle = COLORS.GROUND_TRUTH;
            this.ctx.beginPath();
            this.ctx.arc(groundTruth[timeIndex][0], groundTruth[timeIndex][1], 6 / this.scale, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        if (timeIndex < estimates.length) {
            const est = estimates[timeIndex];
            const cov = covariances[timeIndex];
            if (est && cov) {
                // Test if ground truth lies inside 95% ellipse
                const pos = estimates[timeIndex];
                const cov = covariances[timeIndex];
                let inside = true;
                if (pos && cov) {
                    const dx = groundTruth[timeIndex][0] - pos[0];
                    const dy = groundTruth[timeIndex][1] - pos[1];
                    const Sinv = MatrixUtils.inverse2x2(cov);
                    const d2 = dx*(Sinv[0][0]*dx + Sinv[0][1]*dy) +
                               dy*(Sinv[1][0]*dx + Sinv[1][1]*dy);
                    inside = (d2 <= 5.991); // 95% chi-square cutoff
                }

                this.ctx.globalAlpha = 0.3;
                this.ctx.strokeStyle = inside ? 'rgba(0,255,255,1)' : 'rgba(255,80,80,1)';
                this.ctx.lineWidth = 2;
                this.drawErrorEllipse(pos[0], pos[1], cov);
                this.ctx.stroke();

                this.ctx.globalAlpha = 0.05;
                this.ctx.fillStyle = inside ? 'rgba(0,255,255,1)' : 'rgba(255,80,80,1)';
                this.ctx.fill();

                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = COLORS.ESTIMATES;
                this.ctx.beginPath();
                this.ctx.arc(est[0], est[1], 6 / this.scale, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
        this.ctx.restore();
    }
}