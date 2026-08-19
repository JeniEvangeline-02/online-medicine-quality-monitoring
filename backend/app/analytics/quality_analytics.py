from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.models import QualityTest, QualityTestResult, QualityStandard, Batch, Product

class QualityAnalytics:
    @staticmethod
    def get_quality_performance_and_trends(
        db: Session,
        days: int = 30,
        product_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Calculates test pass rate, failure rate, critical failures, and time-series trends."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Base tests query
        q = db.query(QualityTest)
        if product_id:
            q = q.join(Batch).filter(Batch.product_id == product_id)
        
        total_tests = q.count()
        completed_tests = q.filter(QualityTest.status == "COMPLETED").count()
        passed_tests = q.filter(QualityTest.overall_result == "PASS").count()
        failed_tests = q.filter(QualityTest.overall_result == "FAIL").count()
        pending_tests = q.filter(QualityTest.overall_result == "PENDING").count()

        # Critical failures
        res_q = db.query(QualityTestResult)
        if product_id:
            res_q = res_q.join(QualityTest).join(Batch).filter(Batch.product_id == product_id)
        critical_failures = res_q.filter(QualityTestResult.is_critical_failure == True).count()

        pass_rate = round((passed_tests / completed_tests * 100), 1) if completed_tests > 0 else 100.0
        failure_rate = round((failed_tests / completed_tests * 100), 1) if completed_tests > 0 else 0.0

        # Trends over intervals (e.g. daily/weekly buckets)
        # Generate buckets based on days
        bucket_count = 7 if days <= 7 else (15 if days <= 30 else 30)
        bucket_size_days = max(1, days // bucket_count)
        
        trend_series = []
        for i in range(bucket_count):
            b_end = datetime.utcnow() - timedelta(days=i * bucket_size_days)
            b_start = b_end - timedelta(days=bucket_size_days)
            
            b_tests = q.filter(QualityTest.created_at >= b_start, QualityTest.created_at < b_end)
            b_total = b_tests.count()
            b_pass = b_tests.filter(QualityTest.overall_result == "PASS").count()
            b_fail = b_tests.filter(QualityTest.overall_result == "FAIL").count()
            b_pass_rate = round((b_pass / b_total * 100), 1) if b_total > 0 else 100.0

            trend_series.append({
                "date": b_start.strftime("%b %d"),
                "total_tests": b_total,
                "passed": b_pass,
                "failed": b_fail,
                "pass_rate": b_pass_rate
            })

        trend_series.reverse()

        return {
            "summary": {
                "total_tests": total_tests,
                "completed_tests": completed_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "pending_tests": pending_tests,
                "critical_failures": critical_failures,
                "pass_rate": pass_rate,
                "failure_rate": failure_rate
            },
            "trend": trend_series
        }
