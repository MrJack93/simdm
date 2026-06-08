/**
 * @fileoverview Tipuri JSDoc pentru entitățile API SIMDM.
 *
 * Aceste typedef-uri oferă autocompletare și type-checking în VS Code
 * fără a migra la TypeScript. Importați tipul dorit cu:
 *   @type {import('../types').Device}
 *
 * Pentru migrare viitoare la TypeScript, fiecare typedef corespunde
 * unui interface TypeScript echivalent.
 */

// ─── Enumerări ────────────────────────────────────────────────────────────────

/**
 * @typedef {'FUNCTIONAL'|'IN_REPARATIE'|'DEFECT'|'CASAT'|'IMPRUMUTAT'|'REZERVA'} DeviceStatus
 */

/**
 * @typedef {'I'|'IIa'|'IIb'|'III'} RiskClass
 */

/**
 * @typedef {'preventive'|'corrective'} MaintenanceType
 */

/**
 * @typedef {'monthly'|'quarterly'|'yearly'} MaintenanceFrequency
 */

/**
 * @typedef {'scheduled'|'completed'|'overdue'} MaintenancePlanStatus
 */

/**
 * @typedef {'CREATE'|'UPDATE'|'DELETE'|'LOGIN'|'LOGOUT'|'LOGIN_FAILED'|'FILE_UPLOAD'|'STOCK_UPDATE'} AuditAction
 */

/**
 * @typedef {'low'|'medium'|'high'|'critical'} IncidentSeverity
 */

// ─── Entități principale ──────────────────────────────────────────────────────

/**
 * @typedef {Object} Device
 * @property {number}       id                - ID unic în baza de date
 * @property {string}       inventoryNumber   - Număr inventar (ex: DM-2024-001)
 * @property {string}       name              - Denumire dispozitiv
 * @property {string}       [model]           - Model
 * @property {string}       [serialNumber]    - Număr de serie
 * @property {string}       [manufacturer]    - Producător
 * @property {number}       [yearMade]        - Anul fabricării
 * @property {RiskClass}    riskClass         - Clasa de risc MD
 * @property {DeviceStatus} status            - Status curent
 * @property {number}       sectionId         - FK → Section.id
 * @property {string}       [section]         - Denumire secție (join)
 * @property {string}       [location]        - Locație / spațiu
 * @property {string}       [countryOfOrigin] - Țara de origine
 * @property {number}       [purchasePrice]   - Preț achiziție
 * @property {string}       [currency]        - Monedă (MDL/EUR/USD)
 * @property {string}       [ceMarking]       - Marcaj CE
 * @property {string}       [cndCode]         - Cod CND
 * @property {string|null}  [acquisitionDate] - Data achiziției (ISO 8601)
 * @property {string|null}  [warrantyExpiry]  - Data expirării garanției (ISO 8601)
 * @property {number}       [maintenanceSchedule] - Interval mentenanță (luni)
 * @property {string}       [notes]           - Note / observații
 * @property {string}       createdAt         - Timestamp creare (ISO 8601)
 * @property {string}       updatedAt         - Timestamp actualizare (ISO 8601)
 */

/**
 * @typedef {Object} Section
 * @property {number} id    - ID unic
 * @property {string} name  - Denumire secție
 */

/**
 * @typedef {Object} Consumable
 * @property {number}      id              - ID unic
 * @property {string}      name            - Denumire consumabil
 * @property {string}      [model]         - Model
 * @property {string}      [manufacturer]  - Producător
 * @property {number}      quantity        - Cantitate curentă în stoc
 * @property {number}      minQuantity     - Cantitate minimă (prag alertă)
 * @property {string}      [unitOfMeasure] - Unitate de măsură (buc, ml, etc.)
 * @property {string|null} [expiryDate]    - Data expirării (ISO 8601)
 * @property {string}      createdAt
 * @property {string}      updatedAt
 */

/**
 * @typedef {Object} MaintenancePlan
 * @property {number}                  id            - ID unic
 * @property {number}                  deviceId      - FK → Device.id
 * @property {string}                  deviceName    - Denumire dispozitiv (join)
 * @property {MaintenanceType}         type          - Tip mentenanță
 * @property {MaintenanceFrequency}    frequency     - Frecvență
 * @property {string}                  scheduledDate - Data planificată (ISO 8601)
 * @property {MaintenancePlanStatus}   status        - Status curent
 */

/**
 * @typedef {Object} MaintenanceExecution
 * @property {number}  id                - ID unic
 * @property {number}  maintenancePlanId - FK → MaintenancePlan.id
 * @property {string}  deviceName        - Denumire dispozitiv (join)
 * @property {string}  engineerName      - Nume inginer (join)
 * @property {string}  executionDate     - Data execuției (ISO 8601)
 * @property {string}  inspectionResult  - Rezultat inspecție
 * @property {string}  [partiesReplaced] - Piese înlocuite
 * @property {string}  [technicalNotes]  - Note tehnice
 * @property {string}  [signature]       - Semnătură digitală (base64 PNG)
 * @property {string}  status            - Status ('completed')
 */

/**
 * @typedef {Object} AuditLogUser
 * @property {string} username
 */

/**
 * @typedef {Object} AuditLog
 * @property {number}          id        - ID unic
 * @property {AuditAction}     action    - Tipul acțiunii
 * @property {string}          entity    - Entitatea afectată (ex: 'Device')
 * @property {number|string}   [entityId]- ID-ul entității afectate
 * @property {Object|null}     [changes] - Obiect JSON cu modificările (before/after)
 * @property {string}          timestamp - Timestamp (ISO 8601)
 * @property {string}          [ipAddress] - Adresa IP a clientului
 * @property {AuditLogUser}    [users]   - Utilizatorul care a efectuat acțiunea
 */

/**
 * @typedef {Object} Incident
 * @property {number}           id               - ID unic
 * @property {string}           description      - Descrierea incidentului
 * @property {IncidentSeverity} severity         - Severitate
 * @property {string}           occurredAt       - Data producerii (ISO 8601)
 * @property {boolean}          patientAffected  - A fost afectat un pacient?
 * @property {string}           [patientHarm]    - Descrierea vătămării
 * @property {boolean}          reportedToAmdm   - Raportat la AMDM?
 * @property {string}           [amdmReportRef]  - Numărul raportului AMDM
 * @property {string}           [amdmReportDate] - Data raportului AMDM (ISO 8601)
 * @property {string}           [correctiveAction]  - Acțiune corectivă
 * @property {string}           [preventiveAction]  - Acțiune preventivă
 * @property {number}           [deviceId]       - FK → Device.id
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} [email]
 * @property {string} [role]  - ex: 'admin' | 'engineer' | 'viewer'
 */

// ─── Tipuri pentru răspunsurile paginare API ──────────────────────────────────

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]}    data       - Array de rezultate pentru pagina curentă
 * @property {number} total      - Număr total de înregistrări
 * @property {number} page       - Pagina curentă (1-indexed)
 * @property {number} totalPages - Număr total de pagini
 * @property {number} limit      - Rezultate per pagină
 */

/**
 * @typedef {Object} DevicesResponse
 * @property {Device[]} devices
 * @property {number}   total
 */

/**
 * @typedef {Object} ConsumablesResponse
 * @property {Consumable[]} consumables
 * @property {number}       total
 */

// ─── Tipuri pentru Auth ───────────────────────────────────────────────────────

/**
 * @typedef {Object} AuthContextValue
 * @property {User|null} user     - Utilizatorul autentificat sau null
 * @property {boolean}   loading  - true în timp ce se verifică sesiunea
 * @property {(username: string, password: string) => Promise<void>} login
 * @property {() => Promise<void>} logout
 */
