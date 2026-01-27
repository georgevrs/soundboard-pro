"""Add ingest status tracking to sounds

Revision ID: 002_add_ingest_status
Revises: 001_initial_schema
Create Date: 2025-01-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_ingest_status'
down_revision = '001_initial'  # Match the actual revision ID from 001_initial_schema.py
branch_labels = None
depends_on = None


def upgrade():
    # Add ingest status tracking columns
    op.add_column('sounds', sa.Column('ingest_status', sa.Text(), nullable=True))
    op.add_column('sounds', sa.Column('ingest_retry_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('sounds', sa.Column('last_error', sa.Text(), nullable=True))
    
    # Add constraint for ingest_status
    op.create_check_constraint(
        'check_ingest_status',
        'sounds',
        "ingest_status IS NULL OR ingest_status IN ('PENDING', 'IN_PROGRESS', 'READY', 'FAILED')"
    )


def downgrade():
    # Remove constraint
    op.drop_constraint('check_ingest_status', 'sounds', type_='check')
    
    # Remove columns
    op.drop_column('sounds', 'last_error')
    op.drop_column('sounds', 'ingest_retry_count')
    op.drop_column('sounds', 'ingest_status')
