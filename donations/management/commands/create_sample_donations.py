from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from donations.models import DonationCategory, DonationSubCategory, MemberDonation
from memberships.models import Membership
from datetime import datetime, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample donation categories, subcategories, and member donations for testing'

    def handle(self, *args, **options):
        self.stdout.write("Creating sample donation data...")

        # Create donation categories
        categories_data = [
            {'title': 'General Donations', 'title_others': 'Sumbangan Umum'},
            {'title': 'Scholarship Fund', 'title_others': 'Dana Beasiswa'},
            {'title': 'Building Fund', 'title_others': 'Dana Bangunan'},
            {'title': 'Community Service', 'title_others': 'Layanan Komunitas'},
        ]

        categories = {}
        for cat_data in categories_data:
            cat, created = DonationCategory.objects.get_or_create(
                title=cat_data['title'],
                defaults={
                    'title_others': cat_data['title_others'],
                    'is_active': True,
                    'is_date_required': True,
                    'is_multi_select_required': False,
                }
            )
            categories[cat_data['title']] = cat
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ Created category: {cat.title}"))
            else:
                self.stdout.write(f"Category already exists: {cat.title}")

        # Create subcategories
        subcategories_data = {
            'General Donations': [
                {'title': 'Monthly Contribution', 'title_others': 'Kontribusi Bulanan'},
                {'title': 'One-time Donation', 'title_others': 'Sumbangan Satu Kali'},
                {'title': 'Special Occasion', 'title_others': 'Acara Khusus'},
            ],
            'Scholarship Fund': [
                {'title': 'Undergraduate Scholarship', 'title_others': 'Beasiswa Sarjana'},
                {'title': 'Graduate Scholarship', 'title_others': 'Beasiswa Pascasarjana'},
                {'title': 'Merit-based Scholarship', 'title_others': 'Beasiswa Berprestasi'},
            ],
            'Building Fund': [
                {'title': 'New Building', 'title_others': 'Bangunan Baru'},
                {'title': 'Renovation', 'title_others': 'Renovasi'},
                {'title': 'Maintenance', 'title_others': 'Pemeliharaan'},
            ],
            'Community Service': [
                {'title': 'Youth Program', 'title_others': 'Program Pemuda'},
                {'title': 'Healthcare Initiative', 'title_others': 'Inisiatif Kesehatan'},
                {'title': 'Education Program', 'title_others': 'Program Pendidikan'},
            ],
        }

        subcategories = {}
        for cat_name, subs in subcategories_data.items():
            category = categories[cat_name]
            for sub_data in subs:
                sub, created = DonationSubCategory.objects.get_or_create(
                    title=sub_data['title'],
                    defaults={
                        'donation_category': category,
                        'title_others': sub_data['title_others'],
                        'is_active': True,
                    }
                )
                subcategories[sub_data['title']] = sub
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Created subcategory: {sub.title}"))
                else:
                    self.stdout.write(f"  Subcategory already exists: {sub.title}")

        # Create sample member donations
        self.stdout.write("\nCreating sample member donations...")
        
        try:
            # Get testuser
            testuser = User.objects.get(email='testuser@example.com')
            membership = Membership.objects.filter(user=testuser).first()
            
            if not membership:
                self.stdout.write(self.style.WARNING("⚠ No membership found for testuser@example.com. Please create one first."))
                return

            # Sample donation amounts
            sample_donations = [
                {
                    'category': 'General Donations',
                    'subcategory': 'Monthly Contribution',
                    'amount': 100.00,
                    'days_ago': 60,
                    'status': 'completed',
                },
                {
                    'category': 'Scholarship Fund',
                    'subcategory': 'Undergraduate Scholarship',
                    'amount': 500.00,
                    'days_ago': 45,
                    'status': 'completed',
                },
                {
                    'category': 'Building Fund',
                    'subcategory': 'Renovation',
                    'amount': 250.00,
                    'days_ago': 30,
                    'status': 'completed',
                },
                {
                    'category': 'Community Service',
                    'subcategory': 'Youth Program',
                    'amount': 150.00,
                    'days_ago': 15,
                    'status': 'pending',
                },
                {
                    'category': 'General Donations',
                    'subcategory': 'One-time Donation',
                    'amount': 300.00,
                    'days_ago': 7,
                    'status': 'completed',
                },
                {
                    'category': 'Scholarship Fund',
                    'subcategory': 'Merit-based Scholarship',
                    'amount': 200.00,
                    'days_ago': 2,
                    'status': 'completed',
                },
            ]

            for donation_data in sample_donations:
                donation_date = datetime.now().date() - timedelta(days=donation_data['days_ago'])
                
                donation, created = MemberDonation.objects.get_or_create(
                    member=membership,
                    donation_category=categories[donation_data['category']],
                    donation_sub_category=subcategories[donation_data['subcategory']],
                    donation_date=donation_date,
                    defaults={
                        'amount': donation_data['amount'],
                        'status': donation_data['status'],
                        'notes': f"Sample donation for {donation_data['subcategory']}",
                    }
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ Created donation: ${donation.amount} for {donation.donation_sub_category.title} "
                            f"on {donation.donation_date} (Status: {donation.status})"
                        )
                    )
                else:
                    self.stdout.write(f"Donation already exists for {donation_data['subcategory']}")

            self.stdout.write(self.style.SUCCESS("\n✅ Sample donation data created successfully!"))
            self.stdout.write(self.style.WARNING(f"\nUser: {testuser.email}"))
            self.stdout.write(self.style.WARNING(f"Membership: {membership.reference_no}"))
            self.stdout.write(self.style.WARNING(f"Total donations created: {MemberDonation.objects.filter(member=membership).count()}"))

        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    "❌ User 'testuser@example.com' not found. Please create it first using:\n"
                    "   python manage.py createsuperuser"
                )
            )
