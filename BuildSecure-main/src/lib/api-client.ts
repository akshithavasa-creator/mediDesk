/**
 * MediDesk frontend API client.
 *
 * Single place where the browser talks to the backend REST API (fetch only).
 * Contract areas: /api/auth/*, /api/doctors/*, /api/appointments/*,
 * /api/patients/*, /api/records/*, /api/admin/*.
 *
 * Notes:
 * - No Supabase, no Prisma, no server-only modules: this file runs in the browser.
 * - Authentication relies on the backend's HTTP-only `medidesk_session` cookie.
 *   Every request sends `credentials: "include"` so the browser attaches it;
 *   there is no client-readable token, no Authorization header and nothing
 *   session-related stored in localStorage (that would defeat HTTP-only cookie
 *   security).
 * - Errors are thrown as `ApiError` (with HTTP status + server message) so pages
 *   can render real error states instead of fake data.
 * - Endpoints that the backend team has not shipped yet are declared here with
 *   their request/response types; calling them will surface the real HTTP error
 *   (404/500) rather than a fabricated result.
 */

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_BASE_URL = "/api";

let baseUrl = readStoredBaseUrl() ?? DEFAULT_BASE_URL;

/** Override the API base URL (e.g. `http://localhost:4000/api`). */
export function setApiBaseUrl(url: string): void {
  baseUrl = url.replace(/\/+$/, "");
  try {
    window.localStorage.setItem("medidesk.apiBaseUrl", baseUrl);
  } catch {
    /* storage unavailable (private mode) — keep in-memory value */
  }
}

/** Current API base URL (without trailing slash). */
export function getApiBaseUrl(): string {
  return baseUrl;
}

function readStoredBaseUrl(): string | null {
  try {
    return window.localStorage.getItem("medidesk.apiBaseUrl");
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Core request helper                                                 */
/* ------------------------------------------------------------------ */

/** Error thrown for any non-2xx response or network failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Plain JSON body; serialized automatically. */
  body?: unknown;
  /** Query string parameters; `undefined`/`null` values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Abort signal so pages can cancel in-flight loads on unmount. */
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Extract a human-readable message from an error response body. */
function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (Array.isArray(record.errors) && record.errors.length > 0) {
      const first = record.errors[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object") {
        const field = first as Record<string, unknown>;
        if (typeof field.message === "string") return field.message;
      }
    }
  }
  return fallback;
}

/**
 * Perform a request against the backend and return parsed JSON.
 * Throws `ApiError` on network failure or non-2xx status.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    signal,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  // No Authorization header: the HTTP-only medidesk_session cookie set by the
  // backend is sent automatically because of `credentials: "include"` below.

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      credentials: "include",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err; // let callers ignore cancellations
    }
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0,
      err,
    );
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(response.statusText || "Request failed.", response.status);
    }
    return undefined as T;
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, `Request failed with status ${response.status}.`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

/* ------------------------------------------------------------------ */
/* Shared types (aligned with the PDR data model)                      */
/* ------------------------------------------------------------------ */

export type Role = "patient" | "doctor" | "admin";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface PatientProfile {
  userId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  /** Optional clinical field rendered by the profile form. */
  allergies?: string | null;
}

export interface Patient extends User {
  profile?: PatientProfile | null;
}

export interface Doctor {
  id: string;
  userId?: string;
  name?: string;
  specialty: string;
  experienceYears?: number;
  rating?: number;
  bio?: string;
  workingDays?: string[];
  slotTimes?: string[];
  isActive?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  reason?: string | null;
  status: AppointmentStatus;
  createdAt?: string;
  updatedAt?: string;
  /** Denormalized fields the backend may include; optional by contract. */
  patientName?: string;
  doctorName?: string;
  specialty?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  diagnosis: string;
  prescription?: string | null;
  notes?: string | null;
  recordDate?: string;
}

/* ---------------------------- auth -------------------------------- */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

/* ------------------------------------------------------------------ */
/* /api/auth/*                                                         */
/*                                                                     */
/* The backend establishes an HTTP-only `medidesk_session` cookie on    */
/* register/login. The browser attaches it automatically to every      */
/* request (credentials: "include"), so these functions never touch a  */
/* token: after a successful POST they read the canonical session user */
/* from GET /api/auth/me instead of assuming a response body shape.    */
/* ------------------------------------------------------------------ */

export const authApi = {
  /** POST /api/auth/login — sets the session cookie, then returns the user. */
  async login(body: LoginRequest, options?: RequestOptions): Promise<User> {
    await apiRequest<unknown>("/auth/login", {
      ...options,
      method: "POST",
      body,
    });
    return authApi.me(options);
  },

  /** POST /api/auth/register — sets the session cookie, then returns the user. */
  async register(
    body: RegisterRequest,
    options?: RequestOptions,
  ): Promise<User> {
    await apiRequest<unknown>("/auth/register", {
      ...options,
      method: "POST",
      body,
    });
    return authApi.me(options);
  },

  /** POST /api/auth/logout — invalidates the server-side session cookie. */
  async logout(options?: RequestOptions): Promise<void> {
    await apiRequest<void>("/auth/logout", { ...options, method: "POST" });
  },

  /**
   * GET /api/auth/me — current session user (role-based redirect source).
   * Throws `ApiError` with status 401 when there is no valid session cookie.
   */
  me(options?: RequestOptions): Promise<User> {
    return apiRequest<User>("/auth/me", options);
  },
};

/* ------------------------------------------------------------------ */
/* /api/doctors/*                                                      */
/* ------------------------------------------------------------------ */

export interface DoctorListQuery {
  specialty?: string;
  search?: string;
  [key: string]: string | undefined;
}

export const doctorsApi = {
  /** GET /api/doctors — public listing used by the booking flow. */
  list(query?: DoctorListQuery, options?: RequestOptions): Promise<Doctor[]> {
    return apiRequest<Doctor[]>("/doctors", { ...options, query });
  },

  /** GET /api/doctors/:id */
  get(id: string, options?: RequestOptions): Promise<Doctor> {
    return apiRequest<Doctor>(`/doctors/${encodeURIComponent(id)}`, options);
  },

  /** GET /api/doctors/:id/slots?date=YYYY-MM-DD — available time slots. */
  getSlots(
    id: string,
    date: string,
    options?: RequestOptions,
  ): Promise<string[]> {
    return apiRequest<string[]>(`/doctors/${encodeURIComponent(id)}/slots`, {
      ...options,
      query: { date },
    });
  },
};

/* ------------------------------------------------------------------ */
/* /api/appointments/*                                                 */
/* ------------------------------------------------------------------ */

export interface AppointmentListQuery {
  status?: AppointmentStatus | "all";
  /** YYYY-MM-DD */
  from?: string;
  /** YYYY-MM-DD */
  to?: string;
  patientId?: string;
  doctorId?: string;
  [key: string]: string | undefined;
}

export interface CreateAppointmentRequest {
  doctorId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  reason?: string;
}

export interface RescheduleAppointmentRequest {
  /** YYYY-MM-DD */
  date?: string;
  /** HH:mm */
  time?: string;
}

export const appointmentsApi = {
  /** GET /api/appointments — scope depends on the caller's role/JWT. */
  list(
    query?: AppointmentListQuery,
    options?: RequestOptions,
  ): Promise<Appointment[]> {
    return apiRequest<Appointment[]>("/appointments", { ...options, query });
  },

  /** GET /api/appointments/:id */
  get(id: string, options?: RequestOptions): Promise<Appointment> {
    return apiRequest<Appointment>(
      `/appointments/${encodeURIComponent(id)}`,
      options,
    );
  },

  /** POST /api/appointments — booking (server enforces no double booking). */
  create(
    body: CreateAppointmentRequest,
    options?: RequestOptions,
  ): Promise<Appointment> {
    return apiRequest<Appointment>("/appointments", {
      ...options,
      method: "POST",
      body,
    });
  },

  /** POST /api/appointments/:id/cancel */
  cancel(id: string, options?: RequestOptions): Promise<Appointment> {
    return apiRequest<Appointment>(
      `/appointments/${encodeURIComponent(id)}/cancel`,
      { ...options, method: "POST" },
    );
  },

  /** POST /api/appointments/:id/reschedule */
  reschedule(
    id: string,
    body: RescheduleAppointmentRequest,
    options?: RequestOptions,
  ): Promise<Appointment> {
    return apiRequest<Appointment>(
      `/appointments/${encodeURIComponent(id)}/reschedule`,
      { ...options, method: "POST", body },
    );
  },

  /** PATCH /api/appointments/:id/status — doctor confirm/complete/cancel. */
  updateStatus(
    id: string,
    status: AppointmentStatus,
    options?: RequestOptions,
  ): Promise<Appointment> {
    return apiRequest<Appointment>(
      `/appointments/${encodeURIComponent(id)}/status`,
      { ...options, method: "PATCH", body: { status } },
    );
  },
};

/* ------------------------------------------------------------------ */
/* /api/patients/*                                                     */
/* ------------------------------------------------------------------ */

export interface UpdateProfileRequest {
  /** Display name (kept on the user record by the backend). */
  fullName?: string;
  /** Contact phone (kept on the user record by the backend). */
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  allergies?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export const patientsApi = {
  /** GET /api/patients/me — current patient's profile. */
  getMyProfile(options?: RequestOptions): Promise<Patient> {
    return apiRequest<Patient>("/patients/me", options);
  },

  /** PUT /api/patients/me — edit own profile. */
  updateMyProfile(
    body: UpdateProfileRequest,
    options?: RequestOptions,
  ): Promise<Patient> {
    return apiRequest<Patient>("/patients/me", {
      ...options,
      method: "PUT",
      body,
    });
  },

  /** GET /api/patients — doctor/admin listing (role-checked server-side). */
  list(options?: RequestOptions): Promise<Patient[]> {
    return apiRequest<Patient[]>("/patients", options);
  },

  /** GET /api/patients/:id — doctor view of an allowed patient. */
  get(id: string, options?: RequestOptions): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${encodeURIComponent(id)}`, options);
  },
};

/* ------------------------------------------------------------------ */
/* /api/records/*                                                      */
/* ------------------------------------------------------------------ */

export interface RecordListQuery {
  patientId?: string;
  [key: string]: string | undefined;
}

export interface CreateRecordRequest {
  patientId: string;
  appointmentId?: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;
}

export const recordsApi = {
  /** GET /api/records — own records (patient) or allowed ones (doctor). */
  list(
    query?: RecordListQuery,
    options?: RequestOptions,
  ): Promise<MedicalRecord[]> {
    return apiRequest<MedicalRecord[]>("/records", { ...options, query });
  },

  /** POST /api/records — doctor adds a visit record. */
  create(
    body: CreateRecordRequest,
    options?: RequestOptions,
  ): Promise<MedicalRecord> {
    return apiRequest<MedicalRecord>("/records", {
      ...options,
      method: "POST",
      body,
    });
  },

  /** PUT /api/records/:id — only the creating doctor may edit. */
  update(
    id: string,
    body: Partial<CreateRecordRequest>,
    options?: RequestOptions,
  ): Promise<MedicalRecord> {
    return apiRequest<MedicalRecord>(`/records/${encodeURIComponent(id)}`, {
      ...options,
      method: "PUT",
      body,
    });
  },
};

/* ------------------------------------------------------------------ */
/* /api/admin/*                                                        */
/* ------------------------------------------------------------------ */

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

export interface CreateDoctorRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  specialty: string;
  experienceYears?: number;
  bio?: string;
}

export const adminApi = {
  /** GET /api/admin/stats — dashboard summary numbers. */
  stats(options?: RequestOptions): Promise<AdminStats> {
    return apiRequest<AdminStats>("/admin/stats", options);
  },

  /** GET /api/admin/doctors — includes inactive doctors. */
  listDoctors(options?: RequestOptions): Promise<Doctor[]> {
    return apiRequest<Doctor[]>("/admin/doctors", options);
  },

  /** POST /api/admin/doctors — admin creates a doctor account. */
  createDoctor(
    body: CreateDoctorRequest,
    options?: RequestOptions,
  ): Promise<Doctor> {
    return apiRequest<Doctor>("/admin/doctors", {
      ...options,
      method: "POST",
      body,
    });
  },

  /** PATCH /api/admin/doctors/:id — activate/deactivate a doctor. */
  setDoctorActive(
    id: string,
    isActive: boolean,
    options?: RequestOptions,
  ): Promise<Doctor> {
    return apiRequest<Doctor>(`/admin/doctors/${encodeURIComponent(id)}`, {
      ...options,
      method: "PATCH",
      body: { isActive },
    });
  },

  /** GET /api/admin/users */
  listUsers(options?: RequestOptions): Promise<User[]> {
    return apiRequest<User[]>("/admin/users", options);
  },

  /** PATCH /api/admin/users/:id — activate/deactivate a user. */
  setUserActive(
    id: string,
    isActive: boolean,
    options?: RequestOptions,
  ): Promise<User> {
    return apiRequest<User>(`/admin/users/${encodeURIComponent(id)}`, {
      ...options,
      method: "PATCH",
      body: { isActive },
    });
  },

  /** GET /api/admin/appointments — all appointments with filters. */
  listAppointments(
    query?: AppointmentListQuery,
    options?: RequestOptions,
  ): Promise<Appointment[]> {
    return apiRequest<Appointment[]>("/admin/appointments", {
      ...options,
      query,
    });
  },
};
