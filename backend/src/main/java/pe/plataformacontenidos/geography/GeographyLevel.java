package pe.plataformacontenidos.geography;

/** Jerarquía fija (CONTEXTO.md sección 5). PAIS no tiene padre; cada nivel siguiente exige padre del nivel inmediatamente superior. */
public enum GeographyLevel {
    PAIS,
    REGION,
    PROVINCIA,
    DISTRITO,
    LOCALIDAD;

    public GeographyLevel requiredParentLevel() {
        return switch (this) {
            case PAIS -> null;
            case REGION -> PAIS;
            case PROVINCIA -> REGION;
            case DISTRITO -> PROVINCIA;
            case LOCALIDAD -> DISTRITO;
        };
    }
}
