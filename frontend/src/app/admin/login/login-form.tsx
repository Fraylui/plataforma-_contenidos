"use client";

import { useState, type FormEvent } from "react";
import { Envelope, Eye, EyeSlash, Lock, WarningCircle } from "@phosphor-icons/react";
import { loginAction } from "./actions";
import { Button, Field, IconButton, TextInput } from "@/components/ui";

export function LoginForm({ redirectTo }: { redirectTo: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await loginAction(email, password, redirectTo);
      // Si loginAction tuvo éxito, ya redirigió (lanzando internamente) y
      // este código no se alcanza. Solo llegamos aquí en caso de error.
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Correo electrónico" name="email">
        <TextInput
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          leading={<Envelope aria-hidden="true" />}
        />
      </Field>

      <Field label="Contraseña" name="password">
        <TextInput
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          leading={<Lock aria-hidden="true" />}
          trailing={
            <IconButton
              size="sm"
              onClick={() => setShowPassword((v) => !v)}
              label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              icon={showPassword ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
            />
          }
        />
      </Field>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-control bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger-ink">
          <WarningCircle weight="fill" aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? "Verificando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
