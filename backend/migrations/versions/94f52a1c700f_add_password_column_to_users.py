"""Add password column to users

Revision ID: 94f52a1c700f
Revises: d5f3ed9bda88
Create Date: 2026-04-08 08:54:57.245418
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '94f52a1c700f'
down_revision = 'd5f3ed9bda88'
branch_labels = None
depends_on = None


def upgrade():
    # Add the password column with a temporary default for existing rows
    op.add_column('users', sa.Column('password', sa.String(length=200), nullable=False, server_default='TEMP_PASS'))

    # Remove the server_default so future inserts require a real password
    op.alter_column('users', 'password', server_default=None)

    # Fix other tables
    with op.batch_alter_table('investments', schema=None) as batch_op:
        batch_op.alter_column('investor_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.alter_column('loan_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.alter_column('created_at', existing_type=postgresql.TIMESTAMP(), nullable=False)

    with op.batch_alter_table('loans', schema=None) as batch_op:
        batch_op.alter_column('borrower_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.alter_column('status', existing_type=sa.VARCHAR(length=50), nullable=False)
        batch_op.alter_column('created_at', existing_type=postgresql.TIMESTAMP(), nullable=False)
        batch_op.alter_column('amount_funded', existing_type=sa.INTEGER(), type_=sa.Numeric(precision=12, scale=2), existing_nullable=True)

    with op.batch_alter_table('repayments', schema=None) as batch_op:
        batch_op.alter_column('loan_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.alter_column('payment_date', existing_type=postgresql.TIMESTAMP(), nullable=False)

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('created_at', existing_type=postgresql.TIMESTAMP(), nullable=False)


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('created_at', existing_type=postgresql.TIMESTAMP(), nullable=True)
        batch_op.drop_column('password')

    with op.batch_alter_table('repayments', schema=None) as batch_op:
        batch_op.alter_column('payment_date', existing_type=postgresql.TIMESTAMP(), nullable=True)
        batch_op.alter_column('loan_id', existing_type=sa.INTEGER(), nullable=True)

    with op.batch_alter_table('loans', schema=None) as batch_op:
        batch_op.alter_column('amount_funded', existing_type=sa.Numeric(precision=12, scale=2), type_=sa.INTEGER(), existing_nullable=True)
        batch_op.alter_column('created_at', existing_type=postgresql.TIMESTAMP(), nullable=True)
        batch_op.alter_column('status', existing_type=sa.VARCHAR(length=50), nullable=True)
        batch_op.alter_column('borrower_id', existing_type=sa.INTEGER(), nullable=True)

    with op.batch_alter_table('investments', schema=None) as batch_op:
        batch_op.alter_column('created_at', existing_type=postgresql.TIMESTAMP(), nullable=True)
        batch_op.alter_column('loan_id', existing_type=sa.INTEGER(), nullable=True)
        batch_op.alter_column('investor_id', existing_type=sa.INTEGER(), nullable=True)