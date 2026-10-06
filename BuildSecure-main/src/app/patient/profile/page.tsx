import { redirect } from "next/navigation";
import { requirePatient } from "@/lib/auth";
import { PatientProfileForm } from "./PatientProfileForm";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "My profile",
};

export default async function PatientProfilePage() {
  const session = await requirePatient();
  return (
    <ToastProvider>
      <PatientProfileForm userId={session.id} initialName={session.fullName ?? ""} />
    </ToastProvider>
  );
}
