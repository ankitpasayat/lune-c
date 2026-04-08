# lune-c

**Learn C from the ground up.**

An interactive course that covers a full computer science curriculum — data structures, algorithms, operating systems, networking — all taught through C programming with an in-browser code editor. No setup. No installs. Just open your browser and start writing real C code.

---

## Why This Exists

Most C courses fall into one of two traps: they either hold your hand through `printf("Hello World")` and stop there, or they throw you into kernel source code and expect you to swim. Neither works.

lune-c is built around one idea: **you learn C by writing C.** Every concept comes with a live editor where you compile and run code instantly, right in the browser. You get real GCC output, real compiler warnings, real execution times, and real memory usage. When you screw up a pointer, you'll see the segfault — not a sanitized error message.

The curriculum doesn't stop at syntax. It takes you from your first `#include <stdio.h>` through building a working shell, a memory allocator, a key-value store, and a text editor. By the end, you'll understand how the machine actually works.

---

## What You Get

- **89 interactive lessons** across 21 modules, organized into 6 learning phases
- **In-browser code execution** powered by GCC (`-std=c17 -Wall -Wextra`) — real compiler, real output
- **Test-driven exercises** that validate your code against hidden test cases
- **Execution metrics** — see how long your code takes and how much memory it uses
- **Code formatting** with clang-format baked in
- **A sandbox** for when you want to experiment outside the curriculum
- **Dark mode** because we're not animals

---

## The Curriculum

### Phase 1 — Foundations

| Module | Lessons |
|--------|---------|
| **C Fundamentals** | Hello World, Variables & Types, Arithmetic, scanf, Conditionals, Loops, Functions, Recursion |
| **Arrays & Strings** | Arrays, Multidimensional Arrays, Strings as Char Arrays, String Library, Command-Line Arguments |
| **Pointers & Memory** | Pointer Basics, Pointer Arithmetic, Dynamic Memory, Pointers & Functions, Common Pitfalls |

### Phase 2 — Core Data Structures & Algorithms

| Module | Lessons |
|--------|---------|
| **Structs & Enums** | Structs, Structs & Pointers, typedef & Enums, Unions & Bitfields |
| **Linked Lists** | Singly Linked List, Doubly Linked List, Circular Lists, Exercises |
| **Stacks, Queues & Trees** | Stacks, Queues, Binary Trees, Binary Search Trees, Exercises |
| **Sorting & Searching** | Linear & Binary Search, Basic Sorts, Merge Sort, Quicksort, Hash Tables |
| **Algorithm Techniques** | Complexity Analysis, Two Pointers, Sliding Window, Greedy Algorithms |
| **Recursion & Backtracking** | Recursive Deep Dive, Systematic Search |
| **Dynamic Programming** | Introduction, Classic Problems, Advanced DP |

### Phase 3 — Systems & Low-Level

| Module | Lessons |
|--------|---------|
| **File I/O** | File Basics, Reading & Writing, Binary Files, Error Handling |
| **Preprocessor & Build System** | Directives, Macros, Multi-File Projects, Makefiles |
| **Bitwise & Low-Level** | Number Representations, Bitwise Operators, Memory Layout, Bit Manipulation Techniques |

### Phase 4 — OS & Concurrency

| Module | Lessons |
|--------|---------|
| **System Calls & Processes** | fork(), exec(), Signals, Pipes |
| **Threads & Concurrency** | POSIX Threads, Mutexes, Condition Variables, Atomics |
| **IPC & Sockets** | Shared Memory, TCP/UDP, Concurrent Servers |

### Phase 5 — Applications

| Module | Lessons |
|--------|---------|
| **Advanced Data Structures** | Heaps, Graphs, Tries, Union-Find |
| **Building Real Programs** | Shell, Memory Allocator, Key-Value Store, Text Editor |
| **Debugging & Testing** | GDB, Valgrind, Sanitizers, Unit Testing |

### Phase 6 — Specialization

| Module | Lessons |
|--------|---------|
| **Embedded & Constrained C** | Volatile, Fixed-Width Types, Bare-Metal, State Machines |
| **Performance & Advanced C** | Cache Optimization, Function Pointers, SIMD, C Standards |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js, React, TypeScript |
| Code Editor | CodeMirror 6 |
| Compilation | GCC (C17 standard) |
| Formatting | clang-format |
| Content | MDX with frontmatter |
| Styling | Tailwind CSS, shadcn/ui |

---

## Running Locally

**Prerequisites:** Node.js 18+, GCC, clang-format

```bash
# Clone the repo
git clone https://github.com/your-username/lune-c.git
cd lune-c

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The platform compiles and runs C code locally — there's no remote execution service. You **must** have `gcc` and `clang-format` available on your PATH.

<details>
<summary><strong>Installing GCC & clang-format</strong></summary>

**Linux (Debian/Ubuntu):**
```bash
sudo apt update && sudo apt install gcc clang-format
```

**Linux (Fedora):**
```bash
sudo dnf install gcc clang-tools-extra
```

**Linux (Arch):**
```bash
sudo pacman -S gcc clang
```

**macOS:**
```bash
# Install Xcode Command Line Tools (includes clang, which acts as gcc)
xcode-select --install

# For clang-format, use Homebrew
brew install clang-format
```
> On macOS, `gcc` is an alias for Apple Clang. This works fine for lune-c.

**Windows:**

Install [MSYS2](https://www.msys2.org/), then from the MSYS2 terminal:
```bash
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-clang-tools-extra
```
Add `C:\msys64\mingw64\bin` to your system PATH.

Alternatively, use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and follow the Linux instructions above.

**Verify your installation:**
```bash
gcc --version
clang-format --version
```

</details>

---

## Project Structure

```
content/           # MDX lesson files, organized by module
  01-c-fundamentals/
    01-hello-world.mdx
    meta.json
  ...
src/
  app/             # Next.js app router pages and API routes
  components/      # Editor, Exercise, Sidebar, Callout, etc.
  lib/             # Compilation pipeline, content loading, utilities
public/            # Static assets
```

Each module directory contains a `meta.json` (title, phase, description) and numbered `.mdx` lesson files with YAML frontmatter for metadata.

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/run` | POST | Compile and execute C code, returns stdout/stderr/timing/memory |
| `/api/submit` | POST | Run code against test cases, returns pass/fail per case |
| `/api/format` | POST | Format C code using clang-format (Google style) |

**Limits:** 50KB max source, 10s execution timeout, 64KB max output.

---

## Contributing

Contributions are welcome. If you want to add lessons, fix bugs, or improve the editor experience, open a PR.

For new lessons, follow the existing MDX format and frontmatter schema. Each lesson should include at least one interactive `<Editor>` block and ideally an `<Exercise>` with test cases.

---

## License

This project is source-available for personal and educational use only. Commercial use, redistribution, and derivative works for commercial purposes are prohibited without explicit written permission from the author.
