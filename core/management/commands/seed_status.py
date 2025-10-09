from django.core.management.base import BaseCommand
from core.models import Status

class Command(BaseCommand):
    help = "Seed initial Status data for Member Workflow"

    def handle(self, *args, **options):
        data = [
            {
                "internal_status": "Member Workflow",
                "external_status": "Member Workflow",
                "description": "",
                "parent": None,
                "parent_code": "",
                "status_code": "1",
            },
            {
                "internal_status": "Draft Application",
                "external_status": "Draft Application",
                "description": "",
                "parent_code": "1",
                "status_code": "10",
            },
            {
                "internal_status": "Pending Payment",
                "external_status": "Pending Payment",
                "description": "",
                "parent_code": "1",
                "status_code": "11",
            },
            {
                "internal_status": "Pending Approval",
                "external_status": "Pending Approval",
                "description": "Payment Completed and pending management approval",
                "parent_code": "1",
                "status_code": "12",
            },
            {
                "internal_status": "Revise for Review",
                "external_status": "Revise for Review",
                "description": "Application data checked by management and some information required or application is not appropriate and revise application to use for review.",
                "parent_code": "1",
                "status_code": "13",
            },
            {
                "internal_status": "Rejected",
                "external_status": "Rejected",
                "description": "Application was rejected by management.",
                "parent_code": "1",
                "status_code": "14",
            },
            {
                "internal_status": "Terminated",
                "external_status": "Terminated",
                "description": "Application terminated by management.",
                "parent_code": "1",
                "status_code": "15",
            },
            {
                "internal_status": "Approved",
                "external_status": "Approved",
                "description": "Application approved by management.",
                "parent_code": "1",
                "status_code": "16",
            },
        ]

        for entry in data:
            parent = None
            if entry.get("parent_code"):
                parent = Status.objects.filter(status_code=entry["parent_code"]).first()

            obj, created = Status.objects.update_or_create(
                status_code=entry["status_code"],
                defaults={
                    "internal_status": entry["internal_status"],
                    "external_status": entry["external_status"],
                    "description": entry.get("description", ""),
                    "parent": parent,
                    "parent_code": entry.get("parent_code", ""),
                },
            )
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action}: {obj.internal_status}"))
