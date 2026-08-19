from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models import Transport, TransportMonitoringRecord, TransportExcursion

class TransportAnalytics:
    @staticmethod
    def get_transport_health(db: Session) -> Dict[str, Any]:
        """Calculates transit health, temperature compliance during shipping & active shipments."""
        transports = db.query(Transport).order_by(Transport.created_at.desc()).limit(50).all()
        
        in_transit = db.query(Transport).filter(Transport.status == "IN_TRANSIT").count()
        arrived = db.query(Transport).filter(Transport.status == "ARRIVED").count()
        delayed = db.query(Transport).filter(Transport.status == "DELAYED").count()
        open_excursions = db.query(TransportExcursion).filter(TransportExcursion.status == "OPEN").count()

        items = []
        for t in transports:
            latest_rec = db.query(TransportMonitoringRecord).filter(
                TransportMonitoringRecord.transport_id == t.id
            ).order_by(TransportMonitoringRecord.recorded_at.desc()).first()

            has_open_exc = db.query(TransportExcursion).filter(
                TransportExcursion.transport_id == t.id,
                TransportExcursion.status == "OPEN"
            ).count() > 0

            items.append({
                "id": t.id,
                "transport_id": t.transport_id,
                "batch_id": t.batch_id,
                "carrier_name": t.carrier_name,
                "vehicle_number": t.vehicle_number,
                "source": t.source_location,
                "destination": t.destination_location,
                "status": t.status,
                "temp_min": t.temperature_min_required,
                "temp_max": t.temperature_max_required,
                "latest_temp": latest_rec.recorded_temperature if latest_rec else None,
                "latest_humidity": latest_rec.recorded_humidity if latest_rec else None,
                "has_excursions": has_open_exc
            })

        return {
            "summary": {
                "in_transit": in_transit,
                "arrived": arrived,
                "delayed": delayed,
                "open_excursions": open_excursions
            },
            "transports": items
        }
