# CaseReady — 3-Minute Hackathon Demo Script

### 0:00–0:30 — The Customer Context
- **Story:** "Maya ordered a standing desk that never arrived. She opened an inquiry in PayPal, but feels confused and anxious about what 'respond' means."
- **Action:** Launch CaseReady (`npm run dev`). Case `PP-D-1001` loads.
- **Key Point:** "The companion explains in plain language: *Conversation stage. You are not on the clock. PayPal is asking the seller for tracking or refund proof.*"

### 0:30–1:30 — Record Upload & Contradiction Detection
- **Action:** Point out the loaded files (order confirmation, tracking screenshot, seller chat).
- **Highlight:** The contradiction alert appears:
  - Seller says "Delivered" in chat.
  - Tracking screenshot shows "Shipping Label Created, USPS Awaiting Item".
- **Key Point:** "CaseReady reassures Maya that this contradiction is normal and actually forms the backbone of her defense."

### 1:30–2:20 — Grounded Response & Strict Approval Gate
- **Action:** Point to the factual response draft. Note that every sentence links to a source.
- **Action:** Click "Review & Approve". The Approval Modal pops up.
- **Key Point:** "CaseReady will NEVER submit or copy text without Maya's explicit review and approval."
- **Action:** Click "Confirm & Send".

### 2:20–3:00 — Resolution Simulation
- **Action:** Switch to Case `PP-D-1004` (Resolved).
- **Key Point:** "Case settled in buyer's favor. No legal jargon, no false promises. The customer never had to figure out what to ask, what to upload, or what happens next."
