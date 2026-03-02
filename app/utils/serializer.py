def serialize_pagination(pagination, schema):
    return {
        "items": [schema.model_validate(t).model_dump() for t in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": pagination.page,
        "per_page": pagination.per_page,
    }