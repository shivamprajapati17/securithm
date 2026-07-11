from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone, timedelta

from ...core.database import get_db
from ...core.config import get_settings
from ...models.user import User
from ...models.team import TeamInvite
from ...schemas.team import (
    TeamInviteRequest,
    TeamInviteResponse,
    TeamInviteActionResponse,
    TeamMemberResponse,
    MemberRoleUpdate,
)
from ...services.email import send_team_invite
from .auth import get_current_user

router = APIRouter(prefix="/team", tags=["team"])


# ─── Helpers ─────────────────────────────────────────────


def require_org_membership(current_user: User) -> uuid.UUID:
    """Raise 400 if user doesn't belong to an organization."""
    if not current_user.org_id:
        raise HTTPException(
            status_code=400,
            detail="You must belong to an organization to perform this action",
        )
    return current_user.org_id


def require_admin(current_user: User) -> uuid.UUID:
    """Raise 403 if user is not an admin of their organization."""
    org_id = require_org_membership(current_user)
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can perform this action",
        )
    return org_id


# ─── Invite Endpoints ───────────────────────────────────


@router.post("/invite", response_model=TeamInviteResponse, status_code=201)
async def invite_team_member(
    data: TeamInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a new member to your organization.

    Requires admin role. Sends an invitation to the specified email address.
    The invitation expires after 7 days.
    """
    require_admin(current_user)

    # Validate email format
    if not data.email or "@" not in data.email or "." not in data.email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Check if already invited
    existing = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.email == data.email,
            TeamInvite.org_id == current_user.org_id,
            TeamInvite.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"An invitation has already been sent to {data.email}",
        )

    # Check if user with this email is already in the organization
    existing_user = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.org_id == current_user.org_id,
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail=f"User with email {data.email} is already in your organization",
        )

    # Create the invite
    invite = TeamInvite(
        id=uuid.uuid4(),
        org_id=current_user.org_id,
        invited_by=current_user.id,
        email=data.email,
        status="pending",
        message=data.message,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Send invitation email via Resend
    settings = get_settings()
    frontend_url = (
        settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
    )
    invite_link = f"{frontend_url}/auth/register?invite={invite.id}&email={data.email}"
    org_name = current_user.organization.name if current_user.organization else "a team"

    send_team_invite(
        to_email=data.email,
        inviter_name=current_user.display_name or current_user.email,
        org_name=org_name,
        invite_link=invite_link,
        message=data.message,
    )

    response = TeamInviteResponse.model_validate(invite)
    return response


@router.get("/invites", response_model=list[TeamInviteResponse])
async def list_team_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all invitations for the current user's organization."""
    org_id = require_org_membership(current_user)

    invites = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.org_id == org_id,
        )
        .order_by(TeamInvite.created_at.desc())
        .all()
    )

    return [TeamInviteResponse.model_validate(i) for i in invites]


@router.patch("/invite/{invite_id}/accept", response_model=TeamInviteActionResponse)
async def accept_team_invite(
    invite_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a pending team invitation.

    The invite must be for the current user's email and still pending.
    On acceptance, the user joins the inviting organization with role 'member'.
    """
    invite = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.id == invite_id,
            TeamInvite.email == current_user.email,
            TeamInvite.status == "pending",
        )
        .first()
    )

    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found, already processed, or not addressed to you",
        )

    # Check if invite has expired
    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Invitation has expired")

    # Check if user is already in an org
    if current_user.org_id:
        raise HTTPException(
            status_code=409,
            detail="You already belong to an organization. Leave your current org first.",
        )

    # Accept the invite — join the org
    current_user.org_id = invite.org_id
    current_user.role = "member"
    invite.status = "accepted"
    invite.accepted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(invite)

    return TeamInviteActionResponse.model_validate(invite)


@router.patch("/invite/{invite_id}/decline", response_model=TeamInviteActionResponse)
async def decline_team_invite(
    invite_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Decline a pending team invitation."""
    invite = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.id == invite_id,
            TeamInvite.email == current_user.email,
            TeamInvite.status == "pending",
        )
        .first()
    )

    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found, already processed, or not addressed to you",
        )

    invite.status = "declined"
    db.commit()
    db.refresh(invite)

    return TeamInviteActionResponse.model_validate(invite)


@router.delete("/invite/{invite_id}", status_code=204)
async def cancel_invite(
    invite_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a pending invitation (admin only)."""
    org_id = require_admin(current_user)

    invite = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.id == invite_id,
            TeamInvite.org_id == org_id,
            TeamInvite.status == "pending",
        )
        .first()
    )

    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Pending invitation not found",
        )

    invite.status = "cancelled"
    db.commit()


# ─── Members Endpoints ──────────────────────────────────


@router.get("/members", response_model=list[TeamMemberResponse])
async def list_team_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all members of the current user's organization."""
    org_id = require_org_membership(current_user)

    members = (
        db.query(User)
        .filter(
            User.org_id == org_id,
        )
        .order_by(
            # Admins first, then by creation date
            User.role.desc().nullslast(),
            User.created_at.asc(),
        )
        .all()
    )

    return [TeamMemberResponse.model_validate(m) for m in members]


@router.patch("/members/{user_id}/role", response_model=TeamMemberResponse)
async def change_member_role(
    user_id: uuid.UUID,
    data: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change a member's role (admin only)."""
    org_id = require_admin(current_user)

    member = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.org_id == org_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Member not found in your organization",
        )

    # Don't allow self-demotion from admin
    if member.id == current_user.id and data.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot demote yourself. Ask another admin to change your role.",
        )

    member.role = data.role
    db.commit()
    db.refresh(member)

    return TeamMemberResponse.model_validate(member)


@router.delete("/members/{user_id}", status_code=204)
async def remove_member(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a member from the organization (admin only)."""
    org_id = require_admin(current_user)

    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot remove yourself. Ask another admin to remove you.",
        )

    member = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.org_id == org_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Member not found in your organization",
        )

    member.org_id = None
    member.role = "member"
    db.commit()
