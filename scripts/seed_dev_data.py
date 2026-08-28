"""
Script de un solo uso para poblar datos de desarrollo locales (no se ejecuta
en CI ni en producción). Crea un EDITOR, categorías, geografía y artículos
de EJEMPLO explícitamente marcados como tales (contenido de muestra, no
periodismo real verificado -- CONTEXTO.md sección 44.10: la plataforma
prioriza credibilidad, así que el contenido de prueba debe declararse
como tal, nunca pasar por artículo real).
"""
import json
import os
import urllib.request

BASE_URL = "http://localhost:8080"


def request(method, path, token=None, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(BASE_URL + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else None


def login(email, password):
    return request("POST", "/api/v1/auth/login", body={"email": email, "password": password})["accessToken"]


def main():
    admin_email = os.environ["BOOTSTRAP_ADMIN_EMAIL"]
    admin_password = os.environ["BOOTSTRAP_ADMIN_PASSWORD"]
    admin_token = login(admin_email, admin_password)
    print("Admin autenticado.")

    editor_email = "editor@dev.local"
    editor_password = "EditorDevPass123!"
    try:
        request("POST", "/api/v1/admin/users", token=admin_token, body={
            "email": editor_email, "password": editor_password,
            "firstName": "Editor", "lastName": "de Prueba", "role": "EDITOR",
        })
        print("Editor creado.")
    except urllib.error.HTTPError as e:
        if e.code == 409:
            print("Editor ya existía, se reusa.")
        else:
            raise
    editor_token = login(editor_email, editor_password)

    categories = {}
    for name in ["Turismo", "Cultura", "Tecnología"]:
        cat = request("POST", "/api/v1/admin/categories", token=editor_token, body={"name": name})
        categories[name] = cat["id"]
        print(f"Categoría creada: {name} -> {cat['id']}")

    peru = request("POST", "/api/v1/admin/geography", token=editor_token, body={"name": "Perú", "level": "PAIS"})
    ayacucho = request("POST", "/api/v1/admin/geography", token=editor_token,
                        body={"name": "Ayacucho", "level": "REGION", "parentId": peru["id"]})
    print(f"Geografía: Perú={peru['id']} Ayacucho={ayacucho['id']}")

    articles = [
        {
            "title": "[Contenido de ejemplo] Rutas para conocer el centro histórico",
            "excerpt": "Artículo de muestra para probar el listado y la ficha de artículo del sitio.",
            "body": (
                "Este es un artículo de EJEMPLO generado para probar el frontend contra datos reales "
                "de la API, no periodismo verificado. Sirve para validar tipografía, longitud de texto, "
                "imágenes, categorías, etiquetas y ubicación geográfica en una página real.\n\n"
                "Cuando exista contenido editorial real, este artículo de muestra debe eliminarse."
            ),
            "articleType": "GUIA",
            "categoryId": categories["Turismo"],
            "geographyId": ayacucho["id"],
            "tagNames": ["ejemplo", "turismo"],
            "seoTitle": "[Ejemplo] Rutas para conocer el centro histórico",
            "metaDescription": "Artículo de ejemplo para pruebas de frontend.",
        },
        {
            "title": "[Contenido de ejemplo] Tradiciones y memoria oral de la región",
            "excerpt": "Segundo artículo de muestra, en la categoría Cultura, sin ubicación geográfica.",
            "body": (
                "Artículo de EJEMPLO. Ilustra un artículo sin geographyId asociado (no todo contenido "
                "tiene ubicación) y con un video de YouTube de referencia.\n\n"
                "Texto de relleno para poder revisar el ritmo de lectura, el ancho de línea y el "
                "espaciado tipográfico en la página de detalle."
            ),
            "articleType": "HISTORIA",
            "categoryId": categories["Cultura"],
            "tagNames": ["ejemplo", "cultura", "tradiciones"],
            "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
        {
            "title": "[Contenido de ejemplo] Cómo la IA está cambiando el periodismo local",
            "excerpt": "Tercer artículo de muestra, categoría Tecnología.",
            "body": (
                "Artículo de EJEMPLO en la categoría Tecnología, para verificar que el filtrado por "
                "categoría en el listado público funciona con más de un tema."
            ),
            "articleType": "OPINION",
            "categoryId": categories["Tecnología"],
            "tagNames": ["ejemplo", "tecnologia", "ia"],
        },
    ]

    for article_input in articles:
        created = request("POST", "/api/v1/admin/articles", token=editor_token, body=article_input)
        article_id = created["id"]
        request("POST", f"/api/v1/admin/articles/{article_id}/submit", token=editor_token, body={})
        request("POST", f"/api/v1/admin/articles/{article_id}/approve", token=editor_token, body={})
        request("POST", f"/api/v1/admin/articles/{article_id}/publish", token=editor_token, body={})
        print(f"Publicado: {created['title']} -> slug={created['slug']}")


if __name__ == "__main__":
    import urllib.error
    main()
