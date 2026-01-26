"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sounds table
    op.create_table(
        'sounds',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.Text()), nullable=False, server_default='{}'),
        sa.Column('source_type', sa.Text(), nullable=False),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('local_path', sa.Text(), nullable=True),
        sa.Column('cover_image_path', sa.Text(), nullable=True),
        sa.Column('volume', sa.Integer(), nullable=True),
        sa.Column('trim_start_sec', sa.REAL(), nullable=True),
        sa.Column('trim_end_sec', sa.REAL(), nullable=True),
        sa.Column('output_device', sa.Text(), nullable=True),
        sa.Column('play_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("source_type IN ('DIRECT_URL', 'YOUTUBE', 'LOCAL_FILE')", name='check_source_type'),
        sa.CheckConstraint("volume IS NULL OR (volume >= 0 AND volume <= 100)", name='check_volume_range'),
    )

    # Create shortcuts table
    op.create_table(
        'shortcuts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('sound_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('hotkey', sa.Text(), nullable=False),
        sa.Column('action', sa.Text(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['sound_id'], ['sounds.id'], ondelete='CASCADE'),
        sa.CheckConstraint("action IN ('PLAY', 'STOP', 'TOGGLE', 'RESTART')", name='check_action'),
    )

    # Create settings table
    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), primary_key=True, server_default='1'),
        sa.Column('default_output_device', sa.Text(), nullable=True),
        sa.Column('mpv_path', sa.Text(), nullable=False, server_default='mpv'),
        sa.Column('ytdlp_path', sa.Text(), nullable=False, server_default='yt-dlp'),
        sa.Column('storage_dir', sa.Text(), nullable=False),
        sa.Column('stop_previous_on_play', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('allow_overlapping', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('default_volume', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Create indexes
    op.create_index('ix_sounds_source_type', 'sounds', ['source_type'])
    op.create_index('ix_shortcuts_sound_id', 'shortcuts', ['sound_id'])
    op.create_index('ix_shortcuts_hotkey', 'shortcuts', ['hotkey'])


def downgrade() -> None:
    op.drop_index('ix_shortcuts_hotkey', table_name='shortcuts')
    op.drop_index('ix_shortcuts_sound_id', table_name='shortcuts')
    op.drop_index('ix_sounds_source_type', table_name='sounds')
    op.drop_table('settings')
    op.drop_table('shortcuts')
    op.drop_table('sounds')
