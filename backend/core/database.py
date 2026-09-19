from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_settings

settings = get_settings()

if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url,
        echo=settings.database_echo,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.database_url,
        echo=settings.database_echo,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=10,
    )


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sync_database_schema(db_engine=engine, base=Base):
    """Ensure all tables and newly added columns exist in the database."""
    try:
        from .. import models  # noqa: F401
    except Exception:
        pass
    base.metadata.create_all(bind=db_engine)
    try:
        with db_engine.begin() as conn:
            if db_engine.dialect.name == "postgresql":
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id VARCHAR(255)")
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_repo_token VARCHAR(512)")
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255)")
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255)")
                conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_users_auth_id ON users (auth_id)")
            elif db_engine.dialect.name == "sqlite":
                cursor = conn.exec_driver_sql("PRAGMA table_info(users)")
                cols = [row[1] for row in cursor.fetchall()]
                if cols:
                    if "auth_id" not in cols:
                        conn.exec_driver_sql("ALTER TABLE users ADD COLUMN auth_id VARCHAR(255)")
                    if "github_repo_token" not in cols:
                        conn.exec_driver_sql("ALTER TABLE users ADD COLUMN github_repo_token VARCHAR(512)")
                    if "github_id" not in cols:
                        conn.exec_driver_sql("ALTER TABLE users ADD COLUMN github_id VARCHAR(255)")
                    if "wallet_address" not in cols:
                        conn.exec_driver_sql("ALTER TABLE users ADD COLUMN wallet_address VARCHAR(255)")
    except Exception as e:
        print(f"[WARN] Schema sync skipped/failed: {e}")


# Auto-sync in debug mode on first import
if settings.debug:
    sync_database_schema(engine, Base)


