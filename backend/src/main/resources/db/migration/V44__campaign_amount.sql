-- Registro contable de lo cobrado por campaña (sin facturación/pagos
-- automáticos, fuera de alcance del plan de Publicidad directa) — hasta
-- ahora no había forma de llevar cuenta de cuánto se facturó por cada
-- banner vendido, pese a que ese es el propósito del módulo.
ALTER TABLE advertising.campaigns
    ADD COLUMN amount NUMERIC(12, 2),
    ADD COLUMN currency VARCHAR(3);
