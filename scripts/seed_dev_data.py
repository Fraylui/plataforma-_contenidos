"""
Script de un solo uso para poblar datos de desarrollo locales (no se ejecuta
en CI ni en producción). Crea un EDITOR, categorías, geografía y contenido
de EJEMPLO para los tres tipos (Publicaciones, Lugares, Eventos),
explícitamente marcado como tal (contenido de muestra, no periodismo ni
reseñas reales -- CONTEXTO.md sección 44.10: la plataforma prioriza
credibilidad, así que el contenido de prueba debe declararse como tal,
nunca pasar por contenido real).

Esta NO es una plataforma editorial/de noticias: es un directorio de
lugares, eventos y guías prácticas. El contenido de muestra evita el tono
de noticia/prensa (nada de NOTICIA/REPORTAJE/CRONICA) y usa GUIA/TUTORIAL/
RANKING/HISTORIA en su lugar.
"""
import json
import os
import urllib.error
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


def get_or_create_category(token, name, cache):
    if name in cache:
        return cache[name]
    try:
        cat = request("POST", "/api/v1/admin/categories", token=token, body={"name": name})
        cache[name] = cat["id"]
        print(f"Categoría creada: {name} -> {cat['id']}")
        return cat["id"]
    except urllib.error.HTTPError as e:
        if e.code != 409:
            raise
        existing = request("GET", "/api/v1/admin/categories", token=token)
        match = next(c for c in existing if c["name"] == name)
        cache[name] = match["id"]
        print(f"Categoría ya existía: {name} -> {match['id']}")
        return match["id"]


def get_or_create_geo(token, name, level, parent_id, cache):
    key = (name, level)
    if key in cache:
        return cache[key]
    try:
        geo = request("POST", "/api/v1/admin/geography", token=token,
                      body={"name": name, "level": level, "parentId": parent_id})
        cache[key] = geo["id"]
        print(f"Geografía creada: {name} ({level}) -> {geo['id']}")
        return geo["id"]
    except urllib.error.HTTPError as e:
        if e.code != 409:
            raise
        existing = request("GET", "/api/v1/admin/geography", token=token)
        match = next(g for g in existing if g["name"] == name and g["level"] == level)
        cache[key] = match["id"]
        print(f"Geografía ya existía: {name} ({level}) -> {match['id']}")
        return match["id"]


def publish_workflow(token, base_path, item_id):
    request("POST", f"{base_path}/{item_id}/submit", token=token, body={})
    request("POST", f"{base_path}/{item_id}/approve", token=token, body={})
    request("POST", f"{base_path}/{item_id}/publish", token=token, body={})


def main():
    editor_email = "editor@dev.local"
    editor_password = "EditorDevPass123!"
    try:
        editor_token = login(editor_email, editor_password)
        print("Editor de prueba ya existía, se reusa.")
    except urllib.error.HTTPError:
        # El admin bootstrap tiene MFA obligatorio, así que no se puede
        # loguear aquí de forma no interactiva. Si el editor no existe
        # todavía, hay que crearlo una vez a mano vía /api/v1/admin/users
        # con una sesión de admin autenticada (con MFA) y volver a correr
        # este script.
        raise SystemExit(
            "No se pudo loguear como editor@dev.local y no se puede crear "
            "automáticamente porque el admin bootstrap requiere MFA. "
            "Creá el usuario EDITOR una vez desde el panel admin y reintentá."
        )

    categories = {}
    for name in ["Turismo", "Cultura", "Tecnología", "Gastronomía", "Naturaleza", "Vida nocturna"]:
        get_or_create_category(editor_token, name, categories)

    geo = {}
    peru = get_or_create_geo(editor_token, "Perú", "PAIS", None, geo)
    ayacucho = get_or_create_geo(editor_token, "Ayacucho", "REGION", peru, geo)
    cusco = get_or_create_geo(editor_token, "Cusco", "REGION", peru, geo)
    arequipa = get_or_create_geo(editor_token, "Arequipa", "REGION", peru, geo)
    huamanga = get_or_create_geo(editor_token, "Huamanga", "PROVINCIA", ayacucho, geo)
    cusco_prov = get_or_create_geo(editor_token, "Cusco", "PROVINCIA", cusco, geo)

    articles = [
        {
            "title": "[Prueba] Rutas para conocer el centro histórico",
            "excerpt": "Guía de muestra para probar el listado y la ficha de publicación del sitio.",
            "body": (
                "Guía de EJEMPLO generada para probar el frontend contra datos reales de la API, "
                "no contenido editorial verificado. Sirve para validar tipografía, longitud de "
                "texto, imágenes, categorías, etiquetas y ubicación geográfica en una página real.\n\n"
                "Cuando exista contenido real, esta guía de muestra debe eliminarse."
            ),
            "articleType": "GUIA",
            "categoryId": categories["Turismo"],
            "geographyId": huamanga,
            "tagNames": ["prueba", "turismo"],
            "seoTitle": "[Prueba] Rutas para conocer el centro histórico",
            "metaDescription": "Guía de prueba para pruebas de frontend.",
        },
        {
            "title": "[Prueba] Tradiciones y memoria oral de la región",
            "excerpt": "Segunda publicación de muestra, categoría Cultura, sin ubicación geográfica.",
            "body": (
                "Publicación de EJEMPLO. Ilustra contenido sin geographyId asociado (no todo "
                "contenido tiene ubicación) y con un video de referencia.\n\n"
                "Texto de relleno para revisar el ritmo de lectura, el ancho de línea y el "
                "espaciado tipográfico en la página de detalle."
            ),
            "articleType": "HISTORIA",
            "categoryId": categories["Cultura"],
            "tagNames": ["prueba", "cultura", "tradiciones"],
            "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
        {
            "title": "[Prueba] Cómo elegir buen internet si trabajas remoto en Perú",
            "excerpt": "Tercera publicación de muestra, categoría Tecnología.",
            "body": (
                "Guía de EJEMPLO en la categoría Tecnología, para verificar que el filtrado por "
                "categoría en el listado público funciona con más de un tema."
            ),
            "articleType": "TUTORIAL",
            "categoryId": categories["Tecnología"],
            "tagNames": ["prueba", "tecnologia", "remoto"],
        },
        {
            "title": "[Prueba] 10 platos que debes probar en el sur andino",
            "excerpt": "Ranking de muestra, categoría Gastronomía, con ubicación en Cusco.",
            "body": (
                "Ranking de EJEMPLO para probar el tipo de contenido RANKING junto con "
                "geographyId apuntando a una región distinta (Cusco)."
            ),
            "articleType": "RANKING",
            "categoryId": categories["Gastronomía"],
            "geographyId": cusco,
            "tagNames": ["prueba", "gastronomia", "cusco"],
        },
        {
            "title": "[Prueba] Guía rápida para caminatas de un día",
            "excerpt": "Quinta publicación de muestra, categoría Naturaleza, con ubicación en Arequipa.",
            "body": (
                "Guía de EJEMPLO sobre caminatas cortas, usada para probar la combinación "
                "categoría Naturaleza + región Arequipa en el listado público."
            ),
            "articleType": "GUIA",
            "categoryId": categories["Naturaleza"],
            "geographyId": arequipa,
            "tagNames": ["prueba", "naturaleza", "arequipa"],
        },
    ]

    # Publicaciones es el tipo de contenido prioritario para probar volumen:
    # se suma un lote generado con más variedad de categoría/tipo/geografía
    # además de los 5 artículos escritos a mano arriba.
    extra_topics = [
        ("Fin de semana en la sierra sin gastar de más", "GUIA", "Turismo", huamanga),
        ("Ferias artesanales que puedes visitar este mes", "GUIA", "Cultura", cusco),
        ("Apps útiles para planear un viaje corto", "TUTORIAL", "Tecnología", None),
        ("Los mejores miradores para el atardecer", "RANKING", "Naturaleza", arequipa),
        ("Historia detrás del nombre de la plaza principal", "HISTORIA", "Cultura", huamanga),
        ("Cómo armar una mochila para trekking de un día", "TUTORIAL", "Naturaleza", None),
        ("Postres tradicionales que no puedes dejar de probar", "RANKING", "Gastronomía", cusco),
        ("Rutas en bus entre regiones: qué esperar", "GUIA", "Turismo", None),
        ("Bares con música en vivo para el fin de semana", "RANKING", "Vida nocturna", arequipa),
        ("Ferias tecnológicas y meetups locales", "GUIA", "Tecnología", cusco_prov),
    ]
    for idx, (topic, article_type, category_name, geography_id) in enumerate(extra_topics, start=1):
        article_input = {
            "title": f"[Prueba] {topic}",
            "excerpt": f"Publicación de muestra #{idx} para probar volumen de listado, categoría {category_name}.",
            "body": (
                f"Publicación de EJEMPLO #{idx} generada para cargar volumen de datos de prueba "
                "en el entorno local. No es contenido real ni verificado; se usa para validar "
                "paginación, filtros y rendimiento del listado público con más registros.\n\n"
                "Cuando exista contenido real, esta publicación de muestra debe eliminarse."
            ),
            "articleType": article_type,
            "categoryId": categories[category_name],
            "tagNames": ["prueba", "volumen"],
        }
        if geography_id:
            article_input["geographyId"] = geography_id
        articles.append(article_input)

    for article_input in articles:
        created = request("POST", "/api/v1/admin/articles", token=editor_token, body=article_input)
        publish_workflow(editor_token, "/api/v1/admin/articles", created["id"])
        print(f"Publicación publicada: {created['title']} -> slug={created['slug']}")

    places = [
        {
            "name": "[Prueba] Mirador de muestra",
            "excerpt": "Lugar de muestra para probar la ficha de Lugares.",
            "body": (
                "Ficha de EJEMPLO para un lugar. Sirve para validar mapa, coordenadas, "
                "imágenes y categoría en la página pública de Lugares."
            ),
            "categoryId": categories["Naturaleza"],
            "geographyId": huamanga,
            "latitude": -13.1588,
            "longitude": -74.2239,
        },
        {
            "name": "[Prueba] Restaurante de muestra",
            "excerpt": "Segundo lugar de muestra, categoría Gastronomía, en Cusco.",
            "body": (
                "Ficha de EJEMPLO de un lugar gastronómico, sin coordenadas, para probar "
                "que el mapa se oculta correctamente cuando no hay lat/long."
            ),
            "categoryId": categories["Gastronomía"],
            "geographyId": cusco_prov,
        },
        {
            "name": "[Prueba] Bar de muestra",
            "excerpt": "Tercer lugar de muestra, categoría Vida nocturna, en Arequipa.",
            "body": "Ficha de EJEMPLO para probar la categoría Vida nocturna en Lugares.",
            "categoryId": categories["Vida nocturna"],
            "geographyId": arequipa,
        },
    ]

    place_ids = {}
    for place_input in places:
        created = request("POST", "/api/v1/admin/places", token=editor_token, body=place_input)
        publish_workflow(editor_token, "/api/v1/admin/places", created["id"])
        place_ids[place_input["name"]] = created["id"]
        print(f"Lugar publicado: {created['name']} -> slug={created['slug']}")

    events = [
        {
            "title": "[Prueba] Feria de muestra",
            "excerpt": "Evento de muestra para probar la ficha de Eventos.",
            "body": (
                "Ficha de EJEMPLO para un evento, vinculada a un Lugar existente vía "
                "placeId, para probar esa relación en el frontend."
            ),
            "categoryId": categories["Cultura"],
            "geographyId": huamanga,
            "placeId": place_ids["[Prueba] Mirador de muestra"],
            "startsAt": "2026-11-15T19:00:00Z",
            "endsAt": "2026-11-15T23:00:00Z",
        },
        {
            "title": "[Prueba] Concierto de muestra",
            "excerpt": "Segundo evento de muestra, sin placeId, con venueName libre.",
            "body": (
                "Ficha de EJEMPLO de evento sin placeId, usando venueName como texto "
                "libre, para probar ese caso alternativo en el frontend."
            ),
            "categoryId": categories["Vida nocturna"],
            "geographyId": cusco,
            "venueName": "Plaza de muestra (dirección de prueba)",
            "startsAt": "2026-12-05T21:00:00Z",
        },
        {
            "title": "[Prueba] Taller de muestra",
            "excerpt": "Tercer evento de muestra, categoría Tecnología, sin geographyId.",
            "body": "Ficha de EJEMPLO de evento sin ubicación geográfica asociada.",
            "categoryId": categories["Tecnología"],
            "startsAt": "2026-10-20T15:00:00Z",
            "endsAt": "2026-10-20T18:00:00Z",
        },
    ]

    for event_input in events:
        created = request("POST", "/api/v1/admin/events", token=editor_token, body=event_input)
        publish_workflow(editor_token, "/api/v1/admin/events", created["id"])
        print(f"Evento publicado: {created['title']} -> slug={created['slug']}")

    print("\nSeed de datos de prueba completo.")


if __name__ == "__main__":
    main()
