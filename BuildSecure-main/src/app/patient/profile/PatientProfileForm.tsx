"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { MediDeskLogo } from "@/components/MediDeskLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { Calendar, Phone, AlertTriangle, Save } from "lucide-react";

const patientProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Name is too long"),
  dob: z
    .string()
    .transform((value) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        throw new Error("Enter a valid date of birth");
      }
      return parsed.toISOString().slice(0, 10);
    })
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(30, "Phone number is too long")
    .optional(),
  allergies: z
    .string()
    .max(500, "Allergies field is too long")
    .optional(),
  emergencyContactName: z
    .string()
    .max(100, "Contact name is too long")
    .optional(),
  emergencyContactPhone: z
    .string()
    .max(30, "Contact phone is too long")
    .optional(),
});

type PatientProfileFormValues = z.infer<typeof patientProfileSchema>;

interface PatientProfileFormProps {
  userId: string;
  initialName: string;
}

export function PatientProfileForm({ userId, initialName }: PatientProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<{
    dateOfBirth: string | null;
    phone: string | null;
    allergies: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientProfileFormValues>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      fullName: initialName,
      dob: "",
      phone: "",
      allergies: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const { data, error } = await supabase
        .from("patient_profiles")
        .select(
          `
          date_of_birth,
          blood_type,
          allergies,
          emergency_contact_name,
          emergency_contact_phone
        `,
        )
        .eq("profile_id", userId)
        .select(
        `
        date_of_birth,
        blood_type,
        allergies,
        emergency_contact_name,
        emergency_contact_phone
      `,
      )
      .maybeSingle<Database["public"]["Tables"]["patient_profiles"]["Row"]>();

      if (!cancelled) {
        if (error && error.code !== "PGRST116") {
          addToast("Could not load your profile", "error");
        } else if (data) {
          setProfile({
            dateOfBirth: data.date_of_birth,
            phone: null,
            allergies: data.allergies,
            emergencyContactName: data.emergency_contact_name,
            emergencyContactPhone: data.emergency_contact_phone,
          });
          reset({
            fullName: initialName,
            dob: data.date_of_birth ?? "",
            phone: "",
            allergies: data.allergies ?? "",
            emergencyContactName: data.emergency_contact_name ?? "",
            emergencyContactPhone: data.emergency_contact_phone ?? "",
          });
        } else {
          reset({
            fullName: initialName,
            dob: "",
            phone: "",
            allergies: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
          });
        }
        setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, supabase, initialName, reset, addToast]);

  async function onSubmit(values: PatientProfileFormValues) {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: values.fullName,
      }).eq("id", userId);

      if (error) {
        throw new Error("Could not update your name");
      }

      const { error: profileError } = await supabase
        .from("patient_profiles")
        .upsert(
          {
            profile_id: userId,
            date_of_birth: values.dob,
            allergies: values.allergies,
            emergency_contact_name: values.emergencyContactName,
            emergency_contact_phone: values.emergencyContactPhone,
          },
          {
            onConflict: "profile_id",
          },
        );

      if (profileError) {
        throw new Error("Could not save your profile");
      }

      setProfile({
        dateOfBirth: values.dob ?? null,
        phone: values.phone ?? null,
        allergies: values.allergies ?? null,
        emergencyContactName: values.emergencyContactName ?? null,
        emergencyContactPhone: values.emergencyContactPhone ?? null,
      });

      addToast("Profile saved successfully", "success");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save your profile";
      addToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <MediDeskLogo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              Signed in as <span className="font-medium text-zinc-700">{initialName}</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            My profile
          </h1>
          <p className="mt-1 text-zinc-500">
            Update your personal details. Only you can edit this information.
          </p>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            {isLoading ? (
              <div className="flex items-center gap-3 text-zinc-500">
                <svg className="h-5 w-5 animate-spin text-teal-700" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Loading your profile...
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="text-sm font-medium text-zinc-700">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    className={`
                      w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                      placeholder-zinc-400
                      focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                    `}
                    {...register("fullName")}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dob" className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    Date of birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    className={`
                      w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                      focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                    `}
                    {...register("dob")}
                  />
                  {errors.dob && (
                    <p className="text-sm text-red-600">{errors.dob.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 555 0123"
                    className={`
                      w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                      placeholder-zinc-400
                      focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                    `}
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="allergies" className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-zinc-400" />
                    Allergies
                  </label>
                  <textarea
                    id="allergies"
                    rows={2}
                    placeholder="List any known allergies"
                    className={`
                      w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                      placeholder-zinc-400 resize-y
                      focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                    `}
                    {...register("allergies")}
                  />
                  {errors.allergies && (
                    <p className="text-sm text-red-600">{errors.allergies.message}</p>
                  )}
                </div>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-sm font-medium text-zinc-700">
                    Emergency contact
                  </legend>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="emergencyContactName" className="text-xs text-zinc-500">
                      Contact name
                    </label>
                    <input
                      id="emergencyContactName"
                      type="text"
                      placeholder="Jane Doe"
                      className={`
                        w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                        placeholder-zinc-400
                        focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                      `}
                      {...register("emergencyContactName")}
                    />
                    {errors.emergencyContactName && (
                      <p className="text-sm text-red-600">{errors.emergencyContactName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="emergencyContactPhone" className="text-xs text-zinc-500">
                      Contact phone
                    </label>
                    <input
                      id="emergencyContactPhone"
                      type="tel"
                      placeholder="+1 555 0123"
                      className={`
                        w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                        placeholder-zinc-400
                        focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500
                      `}
                      {...register("emergencyContactPhone")}
                    />
                    {errors.emergencyContactPhone && (
                      <p className="text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
                    )}
                  </div>
                </fieldset>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="
                      inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white
                      transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
