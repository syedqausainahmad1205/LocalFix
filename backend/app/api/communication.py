import uuid
from typing import Dict, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.core.security import decode_access_token
from app.models.enums import UserRole
from app.models.user import User
from app.models.booking import Booking
from app.models.communication import Conversation, Message, Notification
from app.db.session import SessionLocal

router = APIRouter(tags=["Communication & Notifications"])


# WebSocket In-Memory Connection Manager
class BookingConnectionManager:
    def __init__(self):
        # Maps booking_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, booking_id: str, websocket: WebSocket):
        await websocket.accept()
        if booking_id not in self.active_connections:
            self.active_connections[booking_id] = []
        self.active_connections[booking_id].append(websocket)

    def disconnect(self, booking_id: str, websocket: WebSocket):
        if booking_id in self.active_connections:
            if websocket in self.active_connections[booking_id]:
                self.active_connections[booking_id].remove(websocket)
            if not self.active_connections[booking_id]:
                del self.active_connections[booking_id]

    async def broadcast_to_booking(self, booking_id: str, message_data: dict):
        if booking_id in self.active_connections:
            for connection in self.active_connections[booking_id]:
                try:
                    await connection.send_json(message_data)
                except Exception:
                    pass


manager = BookingConnectionManager()


class MessageRead(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    sender_name: str
    content: str
    is_read: bool
    created_at: str


class NotificationRead(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    notification_type: str
    reference_type: Optional[str] = None
    reference_id: Optional[uuid.UUID] = None
    is_read: bool
    created_at: str


# --- REST Endpoints for Chat History ---

@router.get("/api/messages/booking/{booking_id}", response_model=List[MessageRead])
def get_booking_messages(
    booking_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve chronological chat history for a service booking."""
    booking = (
        db.query(Booking)
        .options(selectinload(Booking.customer), selectinload(Booking.provider))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Authorize customer or provider only
    is_customer = booking.customer and booking.customer.user_id == current_user.id
    is_provider = booking.provider and booking.provider.user_id == current_user.id
    if not (is_customer or is_provider or current_user.role == UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    conv = db.query(Conversation).filter(Conversation.booking_id == booking.id).first()
    if not conv:
        return []

    messages = (
        db.query(Message)
        .options(selectinload(Message.sender))
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return [
        MessageRead(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name if m.sender else "User",
            content=m.content,
            is_read=m.is_read,
            created_at=m.created_at.strftime("%I:%M %p, %d %b")
        )
        for m in messages
    ]


class MessageCreate(BaseModel):
    content: str


@router.post("/api/messages/booking/{booking_id}", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_booking_message(
    booking_id: uuid.UUID,
    data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send an instant chat message for a booking via reliable HTTP REST.
    Persists message in PostgreSQL and broadcasts immediately to active WebSockets.
    """
    booking = (
        db.query(Booking)
        .options(selectinload(Booking.customer), selectinload(Booking.provider))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    is_customer = booking.customer and booking.customer.user_id == current_user.id
    is_provider = booking.provider and booking.provider.user_id == current_user.id
    if not (is_customer or is_provider or current_user.role == UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    conv = db.query(Conversation).filter(Conversation.booking_id == booking.id).first()
    if not conv:
        conv = Conversation(
            booking_id=booking.id,
            customer_id=booking.customer_id,
            provider_id=booking.provider_id
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    new_msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=content,
        is_read=False
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    time_str = new_msg.created_at.strftime("%I:%M %p, %d %b")

    # Broadcast to any active WebSockets on this booking
    payload_out = {
        "id": str(new_msg.id),
        "conversation_id": str(conv.id),
        "sender_id": str(current_user.id),
        "sender_name": current_user.full_name,
        "content": content,
        "is_read": False,
        "created_at": time_str
    }
    await manager.broadcast_to_booking(str(booking.id), payload_out)

    return MessageRead(
        id=new_msg.id,
        conversation_id=new_msg.conversation_id,
        sender_id=new_msg.sender_id,
        sender_name=current_user.full_name,
        content=new_msg.content,
        is_read=new_msg.is_read,
        created_at=time_str
    )


# --- WebSocket Endpoint for Live Chat ---

@router.websocket("/ws/bookings/{booking_id}/chat")
async def websocket_booking_chat(
    websocket: WebSocket,
    booking_id: str,
    token: Optional[str] = Query(None)
):
    """
    Real-time WebSocket endpoint for instant booking communication.
    Validates JWT token and booking participant identity, persists messages in PostgreSQL.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id_str = payload.get("sub")
    db = SessionLocal()
    try:
        user_uuid = uuid.UUID(user_id_str)
        booking_uuid = uuid.UUID(booking_id)

        user = db.query(User).filter(User.id == user_uuid, User.is_active == True).first()
        booking = (
            db.query(Booking)
            .options(selectinload(Booking.customer), selectinload(Booking.provider))
            .filter(Booking.id == booking_uuid)
            .first()
        )
        if not user or not booking:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        is_customer = booking.customer and booking.customer.user_id == user.id
        is_provider = booking.provider and booking.provider.user_id == user.id
        if not (is_customer or is_provider or user.role == UserRole.ADMIN):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Ensure conversation exists
        conv = db.query(Conversation).filter(Conversation.booking_id == booking.id).first()
        if not conv:
            conv = Conversation(
                booking_id=booking.id,
                customer_id=booking.customer_id,
                provider_id=booking.provider_id
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

        await manager.connect(str(booking_uuid), websocket)

        # Broadcast user connected status
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "").strip()
            if not content:
                continue

            # Persist message in PostgreSQL
            new_msg = Message(
                conversation_id=conv.id,
                sender_id=user.id,
                content=content,
                is_read=False
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)

            # Broadcast to active participants
            payload_out = {
                "id": str(new_msg.id),
                "conversation_id": str(conv.id),
                "sender_id": str(user.id),
                "sender_name": user.full_name,
                "content": content,
                "is_read": False,
                "created_at": new_msg.created_at.strftime("%I:%M %p, %d %b")
            }
            await manager.broadcast_to_booking(str(booking_uuid), payload_out)

    except WebSocketDisconnect:
        manager.disconnect(booking_id, websocket)
    except Exception:
        manager.disconnect(booking_id, websocket)
    finally:
        db.close()


# --- Notifications Endpoints ---

@router.get("/api/notifications", response_model=List[NotificationRead])
def get_user_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve all notifications for the authenticated user."""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        NotificationRead(
            id=n.id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            reference_type=n.reference_type,
            reference_id=n.reference_id,
            is_read=n.is_read,
            created_at=n.created_at.strftime("%I:%M %p, %d %b")
        )
        for n in notifications
    ]


@router.patch("/api/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.patch("/api/notifications/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all unread notifications for the user as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

