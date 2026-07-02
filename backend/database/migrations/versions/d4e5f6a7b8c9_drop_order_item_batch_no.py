"""drop order item batch_no

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-07-02 16:35:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("order_items", "batch_no")


def downgrade() -> None:
    op.add_column(
        "order_items",
        sa.Column("batch_no", sa.BigInteger(), nullable=False, server_default="1"),
    )
    op.execute("UPDATE order_items SET batch_no = 1 WHERE batch_no IS NULL")
    op.alter_column("order_items", "batch_no", server_default=None)
