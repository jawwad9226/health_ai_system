"""create predictions table

Revision ID: create_predictions_table
Revises: create_users_table
Create Date: 2024-03-17

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'create_predictions_table'
down_revision = 'create_users_table'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(), nullable=False),
        sa.Column('symptoms', sa.ARRAY(sa.String()), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.Column('oxygen_level', sa.Float(), nullable=False),
        sa.Column('additional_notes', sa.String(), nullable=True),
        sa.Column('prediction', sa.String(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('recommendations', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_predictions_id'), table_name='predictions')
    op.drop_table('predictions')
