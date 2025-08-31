class MatrixUtils {
    static multiply(A, B) {
        const m = A.length, n = A[0].length, p = B[0].length;
        const C = Array(m).fill().map(() => Array(p).fill(0));
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < p; j++) {
                for (let k = 0; k < n; k++) {
                    C[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return C;
    }

    static transpose(A) {
        return A[0].map((_, i) => A.map(row => row[i]));
    }

    static add(A, B) {
        return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    }

    static subtract(A, B) {
        return A.map((row, i) => row.map((val, j) => val - B[i][j]));
    }

    static inverse2x2(A) {
        const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
        return [
            [A[1][1] / det, -A[0][1] / det],
            [-A[1][0] / det, A[0][0] / det]
        ];
    }

    static identity(n) {
        return Array(n).fill().map((_, i) =>
            Array(n).fill().map((_, j) => i === j ? 1 : 0)
        );
    }

    static extractSubmatrix(matrix, startRow, endRow, startCol, endCol) {
        return matrix.slice(startRow, endRow + 1)
            .map(row => row.slice(startCol, endCol + 1));
    }
}