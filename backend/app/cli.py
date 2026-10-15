"""Maintenance commands:  flask --app run reconcile-funding"""
import click
from flask import current_app
from sqlalchemy import func

from app.extensions import db
from app.models.investments import Investment
from app.models.loan import Loan


@click.command("reconcile-funding")
def reconcile_funding():
    # Recompute loans.amount_funded from the investments table.



    totals = dict(
        db.session.query(Investment.loan_id, func.sum(Investment.amount_invested))
        .group_by(Investment.loan_id)
        .all()
    )
    changed = 0
    for loan in Loan.query.all():
        total = totals.get(loan.id, 0) or 0
        if loan.amount_funded != total:
            loan.amount_funded = total
            changed += 1
        if loan.status == "open" and total >= loan.amount_requested:
            loan.status = "funded"
    db.session.commit()
    click.echo(f"Reconciled {changed} loan(s).")


def register_cli(app):
    app.cli.add_command(reconcile_funding)
