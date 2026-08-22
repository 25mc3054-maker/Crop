Krishi-Net — Features Roadmap

Goal: Make Krishi-Net a one-stop platform for farmers (A→Z). This document lists new components added to the frontend, descriptions, and recommended backend APIs and integration ideas.

How to use
- Frontend: Placeholder pages were added under `frontend/src/components/` and wired into `frontend/src/App.jsx` as hash routes.
- Backend: Suggested REST endpoints below; implement as lightweight routes in `backend/server.js` or a new `backend/routes/` module.

Components (already scaffolded)
- Market Prices — Live local/regional commodity prices, history, alerts
- Pest & Disease ID — Image upload + ML inference, recommended treatments
- Crop Planner — Seasonal calendar, sowing/harvest windows, rotation
- Input Marketplace — Seeds, fertilisers, tools listings and sellers
- Irrigation Scheduler — Water requirement calculator and reminders
- Finance & Loans — Loan marketplace, eligibility, calculators
- Insurance & Claims — Policy lookup, guided claim filing
- Extension Services — Connect with agronomists and schedule visits
- Tutorials & Knowledge Base — Videos and step-by-step guides
- Farm Records & Ledger — Plot mapping, yield/input logs, CSV export
- Supply Chain Tracking — Farm-to-buyer traceability, pickup scheduling
- Satellite & Remote Sensing — NDVI and field health history
- Buyers & Market Linkages — Buyer directory and tender board
- Labor & Services — Hire seasonal labor, local contractors
- Policy & Subsidies — Curated government schemes and application help
- Offline Support & SMS/USSD — Core features available via SMS/USSD
- Carbon & Sustainability — Carbon footprint calculator and credits
- Analytics & Benchmarks — Yield benchmarking and charts
- Document Templates — Printable invoice/subsidy/loan forms

Suggested Backend APIs (examples)
- Authentication
  - POST /auth/login
  - POST /auth/register
  - GET /auth/verify

- Market Prices
  - GET /market/prices?crop=&location=&from=&to=
  - GET /market/prices/trends?crop=&location=
  - POST /market/subscribe (price alert subscription)

- Pest & Disease
  - POST /pest/identify (multipart: image) → {diagnosis, confidence, treatments}
  - GET /pest/info/:id → {details, chemical_controls, cultural_controls}

- Soil
  - POST /soil/estimate (test inputs) → {recommendations}
  - GET /soil/tests/:userId

- Crop Planner
  - GET /planner/calendar?crop=&location=
  - POST /planner/save

- Input Marketplace
  - GET /marketplace/items?category=&location=
  - POST /marketplace/listing
  - POST /marketplace/contact

- Equipment Rentals
  - GET /equipment/nearby?lat=&lon=
  - POST /equipment/book

- Irrigation
  - POST /irrigation/calc (area, crop, soil, evapotranspiration)
  - GET /irrigation/reminders/:userId

- Finance & Insurance
  - GET /finance/products
  - POST /finance/apply
  - GET /insurance/policies/:userId
  - POST /insurance/claim

- Extension & Scheduling
  - GET /experts?crop=&location=
  - POST /experts/schedule

- Satellite & Analytics
  - GET /satellite/ndvi?fieldId=&from=&to=
  - GET /analytics/benchmarks?crop=&location=

- Offline / SMS
  - POST /sms/send (integration with Twilio/other)
  - POST /ussd/handler (for USSD gateway)

Integration & Data sources
- Weather: OpenWeatherMap, Meteomatics, or local provider + alerting rules
- Satellite: Sentinel-2, Planet, or commercial APIs; pre-process NDVI and store tiles
- Payments: UPI (India), local e-wallets, or payment gateway for marketplace transactions
- Messaging: Twilio (SMS/WhatsApp), local SMS gateway, or IVR for low-literacy users
- ML: Image classification model for pest/disease running as separate service (FastAPI/Flask) or serverless inference

Implementation notes / priorities
1. Start with critical offline-capable features: market prices, weather alerts, SMS/USSD flows, and extension connections.
2. Add marketplace and equipment rental with search and contact features (low friction — phone/WhatsApp links).
3. Integrate remote sensing (satellite) as batch jobs; show simple NDVI overlays in frontend.
4. For pest/disease, integrate a hosted ML service or use human-in-the-loop (expert review) before automated actions.
5. Provide CSV export for `Farm Records` and simple printable templates for forms.
6. Make sure all new APIs are optional (graceful fallback) so offline users get core benefits.

Next steps I can take now
- Scaffold lightweight backend routes for a few core features (market prices, equipment, sms) in `backend/`.
- Add README section in `frontend/README.md` documenting how to add content to the placeholder components.
- Wire Dashboard links to the new routes (non-UI: add hash links) so features are discoverable.

If you want me to scaffold backend endpoints for core features now, say "scaffold backend" and I will implement example routes and simple JSON responses for market prices, equipment rentals, and SMS sending (mock).
