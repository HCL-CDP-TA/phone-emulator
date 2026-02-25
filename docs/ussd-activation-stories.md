# USSD Activation Stories

These stories demonstrate how the enriched USSD session metadata — network context, device identity, and behavioural signals — enables targeted activation campaigns in HCL CDP.

Each story documents:
- **Trigger**: The CDP event and property conditions that activate the campaign
- **Timing**: When to fire the outbound message
- **Channel**: SMS, push notification, or both
- **Message angle**: The personalisation hook
- **New properties required**: Which metadata fields make this possible

---

## 1. Data Bundle Browse Abandon

**Scenario**: A customer navigated into the data bundles menu (`*544#`) but exited without purchasing.

**Trigger**:
- Event: `ussd_session_abandoned`
- Conditions:
  - `session_path` contains `"1"` (entered Daily Bundles category) OR `"2"` (Weekly) OR `"3"` (Monthly)
  - `service_code = "*544#"`
  - No `bundle_purchased` event within the same session window

**Timing**: Fire within 2 hours of abandonment.

**Channel**: SMS or push notification (push preferred if app is installed).

**Message angle**:
> "Still thinking about data? Your 100MB daily bundle is still just KES 20. Tap to buy now."

Personalise bundle mention using the deepest `session_path` segment — if path is `"1>1"` the customer reached the 100MB confirmation screen, so reference that specific bundle.

**New properties that make this possible**:
- `session_path` — reveals which bundle category (and which specific bundle) the customer reached before dropping off, enabling hyper-relevant message copy
- `session_depth` — distinguishes shallow browsers (depth 1) from customers who reached confirmation screens (depth 3+), allowing different urgency levels
- `session_duration_s` — very short duration (< 20s) with high depth indicates fast decision, different copy vs. long dwell time

---

## 2. Repeated Balance Check (Financial Stress Signal)

**Scenario**: A customer has checked their balance 3 or more times in 7 days with no subsequent purchase or transfer event — a pattern consistent with financial stress or impending need for a loan.

**Trigger**:
- Event: `balance_checked` (or `airtime_balance_checked`, `mpesa_balance_checked`)
- Conditions:
  - Count ≥ 3 occurrences within a rolling 7-day window
  - No `airtime_purchased`, `bundle_purchased`, or `money_transferred` event in the same window

**Timing**: Fire after the 3rd qualifying balance check.

**Channel**: Push notification (in-app), then SMS if not opened within 24 hours.

**Message angle**:
> "Need a little extra this month? You're eligible for a Safaricom loan of up to KES 5,000. Check eligibility now."

**New properties that make this possible**:
- `network_type` — customers on 2G are in lower-connectivity areas, likely a different demographic segment; use softer copy
- `is_roaming` — roaming customers may be travellers with temporary cash-flow pressure; offer international data bundles instead
- `session_path` — if the customer consistently navigates to M-PESA balance (path `"1>3"`), focus on M-PESA-linked financial products

---

## 3. Roaming Detected — Travel Bundle Offer

**Scenario**: A customer's USSD session registers `is_roaming = true` for the first time in 30 days — indicating international travel.

**Trigger**:
- Event: any USSD event (e.g. `ussd_session_started`)
- Conditions:
  - `is_roaming = true`
  - No roaming event in the last 30 days for this customer

**Timing**: Fire within 5 minutes of roaming detection — the customer is likely just arrived in a foreign country and has not yet bought a roaming bundle.

**Channel**: Push notification with deep-link to bundle purchase flow.

**Message angle**:
> "Welcome to [country]! Stay connected with our international data bundle — 500MB for KES 200. Valid 7 days. Tap to activate."

Country personalisation can be inferred from `plmn` — the PLMN code of the visited network identifies the country even without explicit location data.

**New properties that make this possible**:
- `is_roaming` — the core trigger; without this property, roaming detection required a separate telco feed
- `plmn` — encodes the visited network's MCC+MNC, enabling country inference and localised bundle recommendations
- `network_type` — if the customer is roaming on 2G, prioritise voice/SMS bundles over data; 4G roaming → data bundles

---

## 4. Low Depth Exit — Friction Signal

**Scenario**: A customer started a USSD session but abandoned after only 1–2 steps in under 15 seconds — suggesting the menu was confusing, the customer couldn't find what they needed, or the session timed out unintentionally.

**Trigger**:
- Event: `ussd_session_abandoned`
- Conditions:
  - `session_depth ≤ 2`
  - `session_duration_s < 15`

**Timing**: Fire within 1 hour.

**Channel**: SMS (most reliable for confused/struggling customers who may not have the app).

**Message angle**:
> "Having trouble with USSD? Here's a quick guide to [most common task]. Or reply HELP to chat with us."

Use `service_code` to tailor the help message — `*100#` dropouts get airtime-top-up help; `*544#` dropouts get data bundle help; `*247#` dropouts get banking help.

**New properties that make this possible**:
- `session_depth` — quantifies how far the customer got; depth 1 means they saw the root menu and left immediately
- `session_duration_s` — distinguishes accidental diallers (< 5s) from genuinely confused customers (5–15s at depth 1–2)
- `session_path` — even a short path like `"1"` tells you the customer tried the first menu option, enabling targeted help copy

---

## 5. Loan Application Conversion — Upsell Follow-up

**Scenario**: A customer completed a loan application (`loan_applied`) having navigated through the eligibility check flow (high `session_depth`), indicating genuine intent and eligibility confirmation. This is a high-value conversion moment to follow up with a complementary product.

**Trigger**:
- Event: `loan_applied`
- Conditions:
  - `session_depth ≥ 5` (customer went through eligibility check → apply now → amount entry → PIN entry)
  - `source = "eligibility_check"` (customer was pre-qualified before applying)

**Timing**: Fire 1 hour after loan application (after likely approval SMS from core banking).

**Channel**: Push notification with deep-link to insurance or savings product.

**Message angle**:
> "Your loan is on its way! Protect it with Equity Loan Shield — just KES 50/month covers up to KES 50,000. Tap to add."

**New properties that make this possible**:
- `session_depth` — high depth (≥ 5) confirms the customer completed the multi-step eligibility + application flow, not just browsed
- `session_path` — path `"4>1>1"` (Loans → Eligibility → Apply Now) vs `"4>2"` (Loans → Direct Apply) enables different follow-up angles
- `network_type` — 4G customers get push notification; 2G customers get SMS (push delivery unreliable on slow connections)
- `is_roaming` — delay follow-up for roaming customers until they return home (roaming push notifications may arrive with significant latency)
