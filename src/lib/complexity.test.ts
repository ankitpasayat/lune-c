import { describe, it, expect } from "vitest";
import { estimateComplexity } from "./complexity";

function time(code: string) {
  return estimateComplexity(code).time;
}

function space(code: string) {
  return estimateComplexity(code).space;
}

// ---------------------------------------------------------------------------
// Time complexity
// ---------------------------------------------------------------------------

describe("estimateComplexity - time", () => {
  it("O(1) for no loops or recursion", () => {
    expect(time(`
      int main() {
        int x = 5;
        printf("%d", x);
        return 0;
      }
    `)).toBe("O(1)");
  });

  it("O(n) for single for loop", () => {
    expect(time(`
      int main() {
        for (int i = 0; i < n; i++) {
          sum += arr[i];
        }
      }
    `)).toBe("O(n)");
  });

  it("O(n²) for nested for loops", () => {
    expect(time(`
      int main() {
        for (int i = 0; i < n; i++) {
          for (int j = 0; j < n; j++) {
            matrix[i][j] = 0;
          }
        }
      }
    `)).toBe("O(n²)");
  });

  it("O(n³) for triple nested loops", () => {
    expect(time(`
      int main() {
        for (int i = 0; i < n; i++) {
          for (int j = 0; j < n; j++) {
            for (int k = 0; k < n; k++) {
              c[i][j] += a[i][k] * b[k][j];
            }
          }
        }
      }
    `)).toBe("O(n³)");
  });

  it("O(log n) for halving loop", () => {
    expect(time(`
      int main() {
        while (n > 0) {
          n /= 2;
        }
      }
    `)).toBe("O(log n)");
  });

  it("O(n log n) for loop with inner halving", () => {
    expect(time(`
      int main() {
        for (int i = 0; i < n; i++) {
          int j = n;
          while (j > 0) {
            j /= 2;
          }
        }
      }
    `)).toBe("O(n log n)");
  });

  it("O(n) for linear recursion", () => {
    expect(time(`
      int sum(int n) {
        if (n <= 0) return 0;
        return n + sum(n - 1);
      }
    `)).toBe("O(n)");
  });

  it("O(log n) for binary search recursion", () => {
    expect(time(`
      int bsearch(int arr[], int lo, int hi, int target) {
        if (lo > hi) return -1;
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) return bsearch(arr, mid + 1, hi, target);
        return bsearch(arr, lo, mid - 1, target);
      }
    `)).toBe("O(log n)");
  });

  it("O(2^n) for fibonacci-style recursion", () => {
    expect(time(`
      int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
      }
    `)).toBe("O(2^n)");
  });

  it("O(n log n) for merge sort", () => {
    expect(time(`
      void mergeSort(int arr[], int l, int r) {
        if (l < r) {
          int mid = l + (r - l) / 2;
          mergeSort(arr, l, mid);
          mergeSort(arr, mid + 1, r);
          merge(arr, l, mid, r);
        }
      }
    `)).toBe("O(n log n)");
  });

  it("O(n) for tree traversal (pointer recursion)", () => {
    expect(time(`
      void inorder(Node *node) {
        if (node == NULL) return;
        inorder(node->left);
        printf("%d ", node->data);
        inorder(node->right);
      }
    `)).toBe("O(n)");
  });

  it("O(n!) for backtracking with loop-driven recursion", () => {
    expect(time(`
      void permute(int arr[], int l, int r) {
        if (l == r) { print(arr); return; }
        for (int i = l; i <= r; i++) {
          swap(&arr[l], &arr[i]);
          permute(arr, l + 1, r);
          swap(&arr[l], &arr[i]);
        }
      }
    `)).toBe("O(n!)");
  });

  // do...while support
  it("O(n) for single do...while loop", () => {
    expect(time(`
      int main() {
        int i = 0;
        do {
          i++;
        } while (i < n);
      }
    `)).toBe("O(n)");
  });

  it("O(n²) for do...while nested in for loop", () => {
    expect(time(`
      int main() {
        for (int i = 0; i < n; i++) {
          int j = 0;
          do {
            j++;
          } while (j < n);
        }
      }
    `)).toBe("O(n²)");
  });

  // braceless loops
  it("O(n) for braceless for loop", () => {
    expect(time(`
      int main() {
        for (int i = 0; i < n; i++)
          sum += i;
      }
    `)).toBe("O(n)");
  });

  // mutual recursion
  it("detects mutual recursion as recursive", () => {
    const result = time(`
      void ping(int n) {
        if (n <= 0) return;
        pong(n - 1);
      }
      void pong(int n) {
        if (n <= 0) return;
        ping(n - 1);
      }
    `);
    // Should detect as at least O(n), not O(1)
    expect(result).not.toBe("O(1)");
  });

  // comments and strings shouldn't affect detection
  it("ignores loops inside comments", () => {
    expect(time(`
      int main() {
        // for (int i = 0; i < n; i++) {}
        int x = 5;
        return x;
      }
    `)).toBe("O(1)");
  });

  it("ignores loops inside string literals", () => {
    expect(time(`
      int main() {
        printf("for (int i = 0; i < n; i++)");
        return 0;
      }
    `)).toBe("O(1)");
  });
});

// ---------------------------------------------------------------------------
// Space complexity
// ---------------------------------------------------------------------------

describe("estimateComplexity - space", () => {
  it("O(1) for simple code with no allocation", () => {
    expect(space(`
      int main() {
        int x = 5;
        return x;
      }
    `)).toBe("O(1)");
  });

  it("O(n) for malloc", () => {
    expect(space(`
      int main() {
        int *arr = (int *)malloc(n * sizeof(int));
        free(arr);
      }
    `)).toBe("O(n)");
  });

  it("O(n) for VLA", () => {
    expect(space(`
      int main() {
        int arr[n];
        for (int i = 0; i < n; i++) arr[i] = i;
      }
    `)).toBe("O(n)");
  });

  it("O(n) for recursive function (linear call stack)", () => {
    expect(space(`
      int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
      }
    `)).toBe("O(n)");
  });

  it("O(log n) for divide-and-conquer recursion", () => {
    expect(space(`
      int bsearch(int arr[], int lo, int hi, int target) {
        if (lo > hi) return -1;
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) return bsearch(arr, mid + 1, hi, target);
        return bsearch(arr, lo, mid - 1, target);
      }
    `)).toBe("O(log n)");
  });

  it("O(1) for small fixed arrays", () => {
    expect(space(`
      int main() {
        int buf[10];
        return 0;
      }
    `)).toBe("O(1)");
  });

  it("O(n) for large fixed arrays", () => {
    expect(space(`
      int main() {
        int buf[10000];
        return 0;
      }
    `)).toBe("O(n)");
  });
});
