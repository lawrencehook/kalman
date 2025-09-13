class NoiseUtils {
    static gaussian(sigma = 1.0) {
        const u = Math.random();
        const v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * sigma;
    }

    static addGaussianNoise(position, sigma) {
        return [
            position[0] + this.gaussian(sigma),
            position[1] + this.gaussian(sigma)
        ];
    }
}