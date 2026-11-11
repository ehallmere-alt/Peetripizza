# Peetri Pizza Service App v16.9.1

Scope: selected improvements **2 Smart Print**, **3 Dough ordering 2.0**, **6 System Health**. Kitchen homepage design retained, no new home badges. Shift controls and staff shift mode retired; official customer loyalty is linked at https://peetripizza.ee/bonus/ (no duplicate system).

- Smart Print is browser-dependent. Physical printer selection and print completion cannot be verified by a web page. Defaults to OFF; print journal stores attempts only. User-enabled automatic printing can be blocked by popup policies; the settings queue provides a manual fallback.
- Dough orders are locally stored per pizzeria with delivery dates, editable quantities before confirmation, history, optimistic revisions and statuses (`Tellitud`, `Kinnitatud`, `Tarnitud`). No supplier integration.
- System Health is authenticated and tests local runtime/configuration/storage/release integrity. LIVE connectivity is queried separately on user action; it does not send writes.
- The old shift-operator API is retired (HTTP 410), existing shift and dough data on the server are not deleted.

See `README-RU.md` and `DEPLOY.md` for deployment instructions. Keep `private_data` and external auth/location configs backed up.
