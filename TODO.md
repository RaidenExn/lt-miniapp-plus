# 📋 LT Portal / LT Mini - Performance & Optimization TODO

> [!IMPORTANT]
> **STRICT DIRECTIVE**: None of the items listed below may be applied or merged into the production codebase without **EXPLICIT USER CONFIRMATION**.

---

## 🔮 Pending Future Optimizations (Requires Strict User Approval)

### 1. Hover & Search Input Speculative Pre-fetching
- **Status**: PENDING USER APPROVAL
- **Description**: Trigger background speculative pre-fetching for `summary/preview/get` and `insurance/details/replicate/get` when the user hovers over recent encounter cards or finishes typing in the search input (300ms debounce).
- **Target Impact**: Reduces perceived user wait time from **1,395ms to 0ms (Instant)**.
- **Rules**:
  - Do not implement until the user explicitly requests or confirms this feature.
  - Must remain disabled by default or behind an experimental settings flag until approved.

---

## 🚀 Approved Plan Under Review

### 2. Explicit Brotli/GZIP Compression Headers & Persistent Socket Warmup
- **Status**: PLAN CREATED — AWAITING REVIEW
- **Details**: See [implementation_plan.md](file:///Users/abhijithss/.gemini/antigravity/brain/9582c7c0-9118-42a1-afa6-2257a4069a7e/implementation_plan.md)
