// ================================
// GEOMETRIC TRAJECTORY GENERATORS
// ================================

class Figure8Generator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const phase = t * 3 * 2 * Math.PI / maxTime;
        const x = scale * Math.sin(phase);
        const y = scale * Math.sin(phase) * Math.cos(phase);
        return [x, y];
    }
    getName() { return 'Figure-8'; }
}

class CircleGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const phase = t * 2 * Math.PI / (maxTime / 3);
        const x = scale * Math.cos(phase);
        const y = scale * Math.sin(phase);
        return [x, y];
    }
    getName() { return 'Circle'; }
}

class SquareGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const cycleTime = maxTime / 3;
        const phase = Math.min(Math.max(t / maxTime, 0), 1); // single arc over full duration [0,1]

        if (phase < 0.25) {
            const progress = phase / 0.25; return [scale * (progress * 2 - 1), scale];
        } else if (phase < 0.5) {
            const progress = (phase - 0.25) / 0.25; return [scale, scale * (1 - progress * 2)];
        } else if (phase < 0.75) {
            const progress = (phase - 0.5) / 0.25; return [scale * (1 - progress * 2), -scale];
        } else {
            const progress = (phase - 0.75) / 0.25; return [-scale, scale * (progress * 2 - 1)];
        }
    }
    getName() { return 'Square'; }
}

class HeartGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const phase = t * 6 * Math.PI / maxTime;
        const x = scale * 0.8 * (16 * Math.sin(phase)**3) / 16;
        const y = scale * 0.8 * (13 * Math.cos(phase) - 5 * Math.cos(2*phase) - 2 * Math.cos(3*phase) - Math.cos(4*phase)) / 16;
        return [x, -y];
    }
    getName() { return 'Heart'; }
}

class StarGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const cycleTime = maxTime / 2;
        const phase = ((t % cycleTime) / cycleTime) * 10;
        const pointIndex = Math.floor(phase);
        const progress = phase - pointIndex;

        const outerRadius = scale;
        const innerRadius = scale * 0.4;

        const getStarPoint = (index, outer) => {
            const angle = (index * 2 * Math.PI / 10) - Math.PI / 2;
            const radius = outer ? outerRadius : innerRadius;
            return [radius * Math.cos(angle), radius * Math.sin(angle)];
        };

        const isOuter = pointIndex % 2 === 0;
        const currentPoint = getStarPoint(pointIndex, isOuter);
        const nextPoint = getStarPoint((pointIndex + 1) % 10, !isOuter);

        const x = currentPoint[0] + progress * (nextPoint[0] - currentPoint[0]);
        const y = currentPoint[1] + progress * (nextPoint[1] - currentPoint[1]);
        return [x, y];
    }
    getName() { return 'Star'; }
}

class InfinityGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const phase = t * 6 * Math.PI / maxTime;
        const x = scale * Math.cos(phase) / (1 + Math.sin(phase)**2);
        const y = scale * Math.sin(phase) * Math.cos(phase) / (1 + Math.sin(phase)**2);
        return [x, y];
    }
    getName() { return 'Infinity (∞)'; }
}