import { ReactNode } from "react";

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
};

export function Field({ label, name, defaultValue, required, type = "text", placeholder, min, max }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        className="focus-ring min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        type={type}
        min={min}
        max={max}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  required,
  rows = 4,
  placeholder
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        rows={rows}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
  required
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <select
        className="focus-ring min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
        name={name}
        defaultValue={defaultValue ?? options[0]?.value}
        required={required}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
      <input className="h-4 w-4 rounded border-slate-300 text-blue-600" type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">
      {children}
    </button>
  );
}
