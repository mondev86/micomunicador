import { test, expect } from "@playwright/test";

// Flujo de extremo a extremo del modo demo: no necesita backend ni cuenta,
// así que cubre la app de punta a punta con datos locales.
test("explora en modo demo, guarda una frase y sale del modo demo", async ({ page }) => {
	await page.goto("/");

	// Pantalla de acceso: entrar en modo demo sin cuenta ni backend.
	await page.getByRole("button", { name: "Explorar en modo demo" }).click();

	// La demo abre en "Todos los pictogramas" con el menú colapsado; el botón
	// flotante lo despliega y aparece la barra de frase.
	await page.getByRole("button", { name: "Abrir menú" }).click();
	await expect(page.getByText("Toca un pictograma para armar tu frase...")).toBeVisible();

	// Añadir un pictograma a la frase en construcción.
	await page.getByRole("button", { name: "Sí", exact: true }).first().click();
	await expect(page.getByRole("button", { name: "Quitar Sí", exact: true })).toBeVisible();

	// Guardar la frase como favorita.
	await page.getByRole("button", { name: "Guardar", exact: true }).click();
	await expect(page.getByText("Frase guardada")).toBeVisible();

	// La favorita aparece en la pestaña "Frases".
	await page.getByRole("navigation").getByRole("button", { name: /Frases/ }).click();
	await expect(page.getByText("Frases guardadas")).toBeVisible();
	await expect(page.getByText("Todavía no hay frases guardadas.")).toHaveCount(0);

	// Salir del modo demo vuelve a la pantalla de acceso.
	await page.getByRole("navigation").getByRole("button", { name: /Ajustes/ }).click();
	await page.getByRole("button", { name: "Salir del modo demo" }).click();
	await expect(page.getByRole("button", { name: "Explorar en modo demo" })).toBeVisible();
});
