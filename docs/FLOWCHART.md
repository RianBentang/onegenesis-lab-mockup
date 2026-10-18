# Flowchart HOLABSYS

Diagram Mermaid untuk `FLOW.md` dan `ARCHITECTURE.md`. Kalau diagram dan teksnya berbeda, teks +
kodenya yang benar. Label transisi = nilai `step` yang ditulis ke record.

## 1. Lapis aplikasi

```mermaid
flowchart TB
  subgraph LABAPP[LAB app — LAB/]
    PG[halaman HOLABSYS / Master-Data] --> SH[og-shell.js<br/>MENU, ROLES, tema]
    PG --> PS[page script *-form.js / *-list.js]
  end
  subgraph PAN[PANELIS app — PANELIS/]
    LG[index.html login NIK] --> BT[booth.html scoring]
  end
  PS --> DM[dummy-*.js<br/>store + helper domain]
  BT --> DM
  DM --> LS[(localStorage<br/>satu origin)]
  CSS[og-theme/onegenesis.css + lab.css] -.-> PG & LG & BT
  CDN[CDN: bootstrap, jquery, select2,<br/>tom-select, flatpickr, fullcalendar] -.-> PG & BT
```

## 2. Status dokumen (semua jenis)

```mermaid
stateDiagram-v2
  [*] --> New
  New --> Draft: Save Draft (BSU)
  New --> Approval: Submit (BSU)
  Draft --> Approval: Submit (BSU)
  Approval --> Approval: Approve, bukan level terakhir
  Approval --> Draft: Return to Edit (returned + alasan)
  Approval --> Rejected: Reject (alasan)
  Approval --> TechnicalReview: approval terakhir — Internal (ADM Approve & Receive Sample: Reason saja)
  TechnicalReview --> TechnicalReview: Partial / Subcontract → menunggu pemohon (Agree / Decline)
  TechnicalReview --> Done: SPK terbit (Save & Issue SPK, atau Agree pemohon)
  TechnicalReview --> Rejected: hasil kaji ulang Rejected
  Approval --> SampleDelivery: approval terakhir — External
  Approval --> Scheduling: approval terakhir — Sensory/ASLT (blind code)
  SampleDelivery --> Confirmed: Confirm Delivery (ADM)
  Scheduling --> Running: sesi disimpan di Schedule
  Running --> Scheduling: sesi terakhir dihapus (belum ada report)
  Done --> Closed: report Final (CRL submit → TCM approve)
  Running --> Closed: report Final (CRL submit → TCM approve)
  Closed --> Closed: dokumen Re-test (RT-) / Revision (RV-) terbuka — request tetap Closed, badge "… in Progress"
  Confirmed --> [*]: External selesai
  Rejected --> [*]
```

`getDocStatus()` memetakan: Approval → Confirm to Approve / Partially Approved;
SampleReceipt, TechnicalReview, SampleDelivery & Scheduling → Fully Approved + badge workflow
(TechnicalReview dengan `consentPending` → "Waiting for Requester Approval"); Done / Running / Confirmed /
→ Confirmed (+ badge "Waiting for Report Approval"); `reportStatus: 'Final'` → Closed; dokumen RT- / RV-
terbuka → Closed + badge "Re-test in Progress" / "Revision in Progress". Detail report: §2a, dokumen
Re-test / Revision: §2b.

## 2a. Report (LHU / COA) — satu jalur untuk setiap versi

```mermaid
stateDiagram-v2
  [*] --> Draft: Push Data dari Excel
  Draft --> Draft: Push lagi dari Excel / lampirkan sertifikat Subcontract (tercatat di resultLog)
  Draft --> ConfirmToApprove: Submit for Approval (CRL, flag harus kosong)
  ConfirmToApprove --> Draft: Return to CRL (TCM + alasan)
  ConfirmToApprove --> Final: Approve & Issue (TCM) — snapshot ke reportHistory
  Final --> Draft: dokumen Re-test (RT-) di-submit — hasil diarsipkan di resultLog, reagen dipotong, kembali ke Excel
  Final --> ConfirmToApprove: dokumen Revision (RV-) di-submit — nama / alamat / kemasan
  Final --> [*]: pemohon Download Certificate
```

Selama dokumen Re-test / Revision terbuka, sertifikat terakhir yang terbit tetap berlaku dan bisa
di-download; versi barunya dikerjakan di tab Report dokumen itu.

## 2b. Dokumen Re-test (RT-) / Revision (RV-) — hanya setelah sertifikat terbit

```mermaid
stateDiagram-v2
  [*] --> New: Re-test (BSU atau TCM, Internal) / Revision (CRL / TCM) dari form request atau tab Report
  New --> ConfirmToApprove: Submit Re-test — menunggu pihak lawan (TCM bila BSU membuat, BSU bila TCM)
  ConfirmToApprove --> WaitingReceipt: Approve pihak lawan
  ConfirmToApprove --> ReturnToEdit: Return to Edit (alasan)
  WaitingReceipt --> ReturnToEdit: Return to Edit (ADM)
  ReturnToEdit --> ConfirmToApprove: pembuat ubah + Submit lagi
  ConfirmToApprove --> Rejected: Reject (alasan) — siklus request ditutup
  WaitingReceipt --> Rejected: Reject (ADM)
  WaitingReceipt --> Confirmed: ADM Approve & Receive Sample (Reason) — parameter ke Excel, reagen dipotong, NC
  New --> Confirmed: Submit Revision — report Confirm to Approve
  Confirmed --> Confirmed: Waiting for Results (Excel) → Waiting for CRL Review → Waiting for Report Approval
  Confirmed --> Confirmed: Return to CRL (TCM) — Revision: CRL koreksi lalu Submit lagi
  Confirmed --> Closed: TCM Approve & Issue → LHU -RT n / -R m, sertifikat lama Superseded
  Closed --> [*]
  Rejected --> [*]
```

Satu dokumen terbuka per request. Request tetap Closed, list Internal / ASLT and Sensory
menampilkan dokumennya sebagai accordion di bawah request, dan form request + dokumen punya
sidebar Document Journey (Request → RT- → RV- …).

## 3. Internal end-to-end

```mermaid
sequenceDiagram
  participant B as BSU
  participant A as Approver(s)
  participant D as ADM
  participant C as CRL
  participant X as Excel
  participant R as Report
  participant T as TCM
  B->>A: Submit (step Approval, Confirm To Approve)
  A->>A: Approve per level (approvalIdx++, Partially Approved)
  A-->>D: level terakhir = ADM
  D->>C: Approve & Receive Sample: Reason (Fully Approved, step Technical Review)
  C->>C: Technical Review: kaji ulang, analis, vendor terakreditasi
  C-->>B: Partial / Subcontract → minta persetujuan (customerConsent)
  B-->>C: Agree (atau Decline → CRL ubah review)
  C->>X: SPK + Sample No. + reagen run 1 (step Done), label
  X->>X: Save Raw Data (rawData + resultLog)
  X->>R: Push hasil duplo (reportStatus Draft, resultLog)
  C->>R: review hasil (semua flag kosong) → Submit for Approval
  R->>T: Confirm to Approve
  T->>R: Approve & Issue → LHU, doc Closed (atau Return to CRL)
  R-->>B: Download Certificate
  T-->>X: setelah terbit: dokumen Re-test (RT-) → reagen dipotong, parameter kembali ke Excel → LHU -RT n
```

## 4. Sensory / ASLT end-to-end

```mermaid
sequenceDiagram
  participant B as BSU
  participant A as Approver(s)
  participant S as Schedule (ADM)
  participant P as PANELIS booth
  participant X as Excel
  participant T as TCM
  B->>A: Submit
  A-->>S: approval terakhir: blind codes (step Scheduling)
  S->>S: drag request ke slot / jam (step Running)
  P->>P: login NIK saat sesi berjalan, serving plan per panelis
  P->>X: skor (holabsysPanelScores)
  X->>X: Pull Data: sheet per tes + statistik
  X->>T: Push Data → report Draft → CRL Submit for Approval
  T->>T: Approve & Issue → Closed
  T-->>B: Download Certificate
```

## 5. External

```mermaid
flowchart LR
  S[BSU Submit] --> AP[HOL ... ADM approve] --> SD[Fully Approved<br/>Waiting for Sample Delivery]
  SD -->|ADM Confirm Delivery| CF[Confirmed — selesai]
  CF -.->|vendor menerbitkan COA sendiri| V[(Vendor lab)]
  V -.->|tagihan| INV[Master Data › External Lab Invoices]
```
