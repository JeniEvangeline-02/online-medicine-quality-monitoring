from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models import StorageLocation, StorageMonitoringRecord, StorageExcursion

class StorageAnalytics:
    @staticmethod
    def get_storage_health(db: Session) -> Dict[str, Any]:
        """Calculates environmental compliance metrics for all cold storage facilities."""
        locations = db.query(StorageLocation).all()
        loc_summaries = []

        total_excursions = db.query(StorageExcursion).count()
        open_excursions = db.query(StorageExcursion).filter(StorageExcursion.status == "OPEN").count()

        for loc in locations:
            recs = db.query(StorageMonitoringRecord).filter(
                StorageMonitoringRecord.storage_location_id == loc.id
            ).order_by(StorageMonitoringRecord.recorded_at.desc())
            
            latest = recs.first()
            loc_open_exc = db.query(StorageExcursion).filter(
                StorageExcursion.storage_location_id == loc.id,
                StorageExcursion.status == "OPEN"
            ).count()

            status = "CRITICAL" if loc_open_exc > 0 else ("WARNING" if latest and latest.overall_status == "WARNING" else "NORMAL")

            loc_summaries.append({
                "location_id": loc.id,
                "name": loc.name,
                "location_code": loc.location_code,
                "min_temp": loc.minimum_temperature,
                "max_temp": loc.maximum_temperature,
                "min_humidity": loc.minimum_humidity,
                "max_humidity": loc.maximum_humidity,
                "latest_temp": latest.recorded_temperature if latest else None,
                "latest_humidity": latest.recorded_humidity if latest else None,
                "latest_recorded_at": latest.recorded_at.isoformat() if latest else None,
                "open_excursions": loc_open_exc,
                "health_status": status
            })

        return {
            "total_locations": len(locations),
            "total_excursions": total_excursions,
            "open_excursions": open_excursions,
            "locations": loc_summaries
        }
