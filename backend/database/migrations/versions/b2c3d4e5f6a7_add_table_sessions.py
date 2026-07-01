"""add table sessions

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-01 18:50:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "table_sessions",
        sa.Column("table_id", sa.BigInteger(), nullable=False),
        sa.Column("session_token", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("opened_by", sa.BigInteger(), nullable=True),
        sa.Column("closed_by", sa.BigInteger(), nullable=True),
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["table_id"], ["dining_tables.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_token"),
    )
    op.create_index(op.f("ix_table_sessions_id"), "table_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_table_sessions_session_token"), "table_sessions", ["session_token"], unique=True)
    op.create_index(op.f("ix_table_sessions_status"), "table_sessions", ["status"], unique=False)
    op.create_index(op.f("ix_table_sessions_table_id"), "table_sessions", ["table_id"], unique=False)
    op.create_index(
        "uq_active_session_per_table",
        "table_sessions",
        ["table_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )

    op.add_column("orders", sa.Column("session_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f("ix_orders_session_id"), "orders", ["session_id"], unique=False)
    op.create_foreign_key(
        "fk_orders_session_id_table_sessions",
        "orders",
        "table_sessions",
        ["session_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_orders_session_id_table_sessions", "orders", type_="foreignkey")
    op.drop_index(op.f("ix_orders_session_id"), table_name="orders")
    op.drop_column("orders", "session_id")

    op.drop_index("uq_active_session_per_table", table_name="table_sessions")
    op.drop_index(op.f("ix_table_sessions_table_id"), table_name="table_sessions")
    op.drop_index(op.f("ix_table_sessions_status"), table_name="table_sessions")
    op.drop_index(op.f("ix_table_sessions_session_token"), table_name="table_sessions")
    op.drop_index(op.f("ix_table_sessions_id"), table_name="table_sessions")
    op.drop_table("table_sessions")
