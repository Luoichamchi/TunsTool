"""add order served_at

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-01 20:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("served_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        """
        UPDATE orders
        SET served_at = updated_at
        WHERE status IN ('served', 'completed') AND served_at IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("orders", "served_at")
