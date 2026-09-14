"use client";

import { useState, type FormEvent } from "react";
import { loginAction } from "./actions";
import { AdminButton, formInputClass } from "@/components/admin/ui";

export function LoginForm({ redirectTo }: { redirectTo: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={formInputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={formInputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <AdminButton type="submit" disabled={pending} className="w-full">
        {pending ? "Verificando…" : "Iniciar sesión"}
      </AdminButton>
    </form>
  );
}
