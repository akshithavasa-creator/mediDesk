import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./Button";
import { AlertCircle, Loader2 } from "lucide-react";

interface AuthFormProps {
  title: string;
  subtitle?: string;
  schema: z.ZodType<Record<string, unknown>>;
  fields: Array<{
    name: keyof Record<string, unknown>;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }>;
  submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}

export function AuthForm({
  title,
  subtitle,
  schema,
  fields,
  submitLabel,
  onSubmit,
}: AuthFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      fields.map((f) => [f.name, ""]),
    ) as Record<string, unknown>,
  });

  async function handleFormSubmit(values: Record<string, unknown>) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm leading-6 text-zinc-500">{subtitle}</p>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label
              htmlFor={String(field.name)}
              className="text-sm font-medium text-zinc-700"
            >
              {field.label}
              {field.required !== false && <span className="text-red-500"> *</span>}
            </label>
            <input
              id={String(field.name)}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              className={`
                w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm
                placeholder-zinc-400
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                disabled:cursor-not-allowed disabled:opacity-50
                ${errors[field.name] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              `}
              {...register(String(field.name))}
            />
            {errors[field.name] && (
              <p className="text-sm text-red-600">
                {String(errors[field.name]?.message)}
              </p>
            )}
          </div>
        ))}

        {serverError && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {submitLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </div>
  );
}
