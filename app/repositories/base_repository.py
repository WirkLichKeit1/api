from app.extensions import db

class BaseRepository:
    def __init__(self, model):
        self.model = model

    def get_by_id(self, id: int):
        return db.session.get(self.model, id)

    def get_all(self):
        return self.model.query.all()

    def save(self, instance):
        db.session.add(instance)
        db.session.commit()
        return instance

    def save_all(self, *instances):
        for instance in instances:
            db.session.add(instance)
        db.session.commit()
        return instances

    def flush(self, instance):
        db.session.add(instance)
        db.session.flush()
        return instance

    def delete(self, instance):
        db.session.delete(instance)
        db.session.commit()