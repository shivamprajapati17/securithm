"""Attestation export helpers — canonical JSON document and PDF rendering.

Backs ``GET /solvency/attestation/{id}/export`` (blueprint section 15: PDF/JSON
attestation export) so organizations can share independently-verifiable records
with auditors, users, and counterparties. The PDF embeds the same data as the
JSON document; neither exposes any customer or liability detail.
"""

from __future__ import annotations

from io import BytesIO
from typing import Any

# reportlab is heavy — imported lazily inside render_attestation_pdf so the
# package is only required when a PDF export is actually requested.

from ...models.solvency import Attestation, SolvencyOrg


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def build_attestation_document(att: Attestation, org: SolvencyOrg) -> dict[str, Any]:
    """Build the canonical export document from a signed attestation record."""
    payload = att.payload or {}
    att_fields = {
        "attestationId": payload.get("attestationId") or f"att_{att.id}",
        "snapshotId": payload.get("snapshotId")
        or (str(att.snapshot_id) if att.snapshot_id else None),
        "chain": payload.get("chain") or "ethereum",
        "reserveRoot": payload.get("reserveRoot") or att.reserve_root,
        "liabilityRoot": payload.get("liabilityRoot") or att.liability_root,
        "reserveValueUsd": payload.get("reserveValueUsd") or att.reserve_value,
        "liabilityValueUsd": payload.get("liabilityValueUsd") or att.liability_value,
        "coverageRatio": payload.get("coverageRatio") or att.coverage_ratio,
        "coveragePercent": payload.get("coveragePercent"),
        "solvencyStatus": payload.get("solvencyStatus"),
        "generatedAt": payload.get("generatedAt")
        or (att.created_at.isoformat() if att.created_at else None),
        "expiresAt": payload.get("expiresAt")
        or (att.expires_at.isoformat() if att.expires_at else None),
        "status": payload.get("status") or att.status.value,
        "signature": att.signature,
    }
    return {
        "documentType": "securithm-solvency-attestation",
        "schemaVersion": "1.0",
        "organization": {
            "name": org.display_name,
            "slug": org.slug,
            "website": org.website,
            "methodologyVersion": org.methodology_version,
        },
        "attestation": att_fields,
        "onChain": {
            "published": bool(att.published_tx),
            "txHash": att.published_tx,
            "chain": att.published_chain,
            "contractAddress": att.published_contract_address,
        },
        "disclaimer": payload.get("disclaimer"),
    }


def render_attestation_pdf(document: dict[str, Any]) -> bytes:
    """Render the attestation document as a single-page letter PDF."""
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title=f"Securithm Solvency Attestation — {document['organization']['name']}",
        author="Securithm",
    )

    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        "SecurithmHeader",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        spaceAfter=2,
        textColor=colors.HexColor("#0f172a"),
    )
    sub_style = ParagraphStyle(
        "SecurithmSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=6,
        alignment=TA_CENTER,
    )
    h2 = ParagraphStyle(
        "SecurithmH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        spaceBefore=14,
        spaceAfter=5,
        textColor=colors.HexColor("#0f172a"),
    )
    body = ParagraphStyle(
        "SecurithmBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.5,
    )
    mono = ParagraphStyle(
        "SecurithmMono",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        backColor=colors.HexColor("#f1f5f9"),
        borderPadding=4,
        spaceAfter=4,
    )
    note = ParagraphStyle(
        "SecurithmNote",
        parent=body,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748b"),
    )

    org = document["organization"]
    att = document["attestation"]
    onchain = document["onChain"]

    story: list[Any] = []
    story.append(Paragraph("SECURITHM SOLVENCY ATTESTATION", header_style))
    story.append(
        Paragraph(
            "Proof of Reserves · Proof of Liabilities · Proof of Solvency", sub_style
        )
    )
    story.append(Spacer(1, 4))

    story.append(
        Paragraph(
            f"<b>{org['name']}</b> · {org['slug']}"
            + (
                f" · <font color='#64748b'>{org['website']}</font>"
                if org.get("website")
                else ""
            ),
            body,
        )
    )
    story.append(Spacer(1, 8))

    # ── Key figures ──
    def _usd(v: Any) -> str:
        return f"${float(v or 0):,.2f}"

    figures = Table(
        [
            [
                Paragraph("<b>Verified Reserves</b>", body),
                Paragraph("<b>Verified Liabilities</b>", body),
                Paragraph("<b>Coverage</b>", body),
                Paragraph("<b>Status</b>", body),
            ],
            [
                Paragraph(_usd(att.get("reserveValueUsd")), body),
                Paragraph(_usd(att.get("liabilityValueUsd")), body),
                Paragraph(f"{att.get('coveragePercent') or ''}%", body),
                Paragraph(att.get("solvencyStatus") or att.get("status") or "", body),
            ],
        ],
        colWidths=[1.7 * inch, 1.8 * inch, 1.2 * inch, 1.5 * inch],
    )
    figures.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
            ]
        )
    )
    story.append(figures)

    # ── Roots ──
    story.append(Paragraph("Attestation Commitments", h2))
    story.append(
        Paragraph(f"<b>Attestation ID</b> · {att.get('attestationId') or ''}", body)
    )
    story.append(
        Paragraph(f"<b>Reserve root</b><br/>{att.get('reserveRoot') or ''}", mono)
    )
    story.append(
        Paragraph(f"<b>Liability root</b><br/>{att.get('liabilityRoot') or ''}", mono)
    )
    story.append(
        Paragraph(
            f"<b>Coverage ratio</b> · {att.get('coverageRatio') or ''} &nbsp;&nbsp;"
            f"<b>Methodology</b> · {org.get('methodologyVersion') or '0.1'}",
            body,
        )
    )

    # ── Timestamps & signature ──
    story.append(Paragraph("Provenance & Signature", h2))
    story.append(
        Paragraph(
            f"<b>Generated</b> · {att.get('generatedAt') or ''}<br/>"
            f"<b>Expires</b> · {att.get('expiresAt') or ''}",
            body,
        )
    )
    if onchain.get("published"):
        story.append(
            Paragraph(
                f"<b>On-chain</b> · published on {onchain.get('chain') or 'ethereum'} "
                f"in tx <font face='Courier' size='7.5'>{onchain.get('txHash') or ''}</font>",
                body,
            )
        )
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            f"<b>Signature (HMAC-SHA256)</b><br/>{att.get('signature') or ''}", mono
        )
    )

    if document.get("disclaimer"):
        story.append(Spacer(1, 10))
        story.append(Paragraph(document["disclaimer"], note))

    doc.build(story)
    return buffer.getvalue()
