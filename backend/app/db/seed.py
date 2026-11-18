import logging
from decimal import Decimal
from datetime import time
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.enums import (
    UserRole,
    VerificationStatus,
    PricingType,
)
from app.models.user import User, CustomerProfile, ProviderProfile, Address
from app.models.service import (
    ServiceCategory,
    Service,
    ProviderService,
    ProviderAvailability
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_database():
    db: Session = SessionLocal()
    try:
        logger.info("Starting database seed for LocalFix (Aligarh Locality)...")

        # 1. Seed Service Categories & Services
        categories_data = [
            {
                "name": "Electrician",
                "slug": "electrician",
                "description": "Certified electricians for wiring, short circuits, appliances, and installation in Aligarh.",
                "icon_name": "Zap",
                "display_order": 1,
                "services": [
                    {
                        "name": "Switchboard Repair & Socket Replacement",
                        "description": "Fix loose contacts, sparking sockets, and modular switches.",
                        "base_price": Decimal("199.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 45
                    },
                    {
                        "name": "Ceiling Fan & Exhaust Installation",
                        "description": "Assembly and hanging with safety balancing.",
                        "base_price": Decimal("249.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 45
                    },
                    {
                        "name": "Inverter & Battery Wiring",
                        "description": "Complete setup of home backup inverter with load distribution.",
                        "base_price": Decimal("599.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 90
                    },
                    {
                        "name": "Short Circuit & Tripping Investigation",
                        "description": "Locate hidden cable faults and MCB tripping issues.",
                        "base_price": Decimal("349.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 60
                    }
                ]
            },
            {
                "name": "Plumber",
                "slug": "plumber",
                "description": "Experienced plumbers for leakages, tap repairs, motor installation, and sanitary fittings.",
                "icon_name": "Droplets",
                "display_order": 2,
                "services": [
                    {
                        "name": "Water Tap & Mixer Repair",
                        "description": "Dripping taps, cartridge replacement, and washer fitting.",
                        "base_price": Decimal("149.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 30
                    },
                    {
                        "name": "Washbasin / Kitchen Sink Drainage Leak Fix",
                        "description": "Pipe clearing, trap replacement, and leak sealant.",
                        "base_price": Decimal("299.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 45
                    },
                    {
                        "name": "Water Motor / Submersible Pump Troubleshooting",
                        "description": "Motor priming, valve check, and connection diagnostics.",
                        "base_price": Decimal("499.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 90
                    }
                ]
            },
            {
                "name": "AC Repair & Service",
                "slug": "ac-repair",
                "description": "Professional AC servicing, jet wash, gas refill, and installation for split and window ACs.",
                "icon_name": "Wind",
                "display_order": 3,
                "services": [
                    {
                        "name": "Split AC Jet Pump Deep Cleaning",
                        "description": "Indoor cooling coil and outdoor condenser power jet cleaning.",
                        "base_price": Decimal("499.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "AC Gas Leakage Check & Refill",
                        "description": "Nitrogen pressure testing, brazing, and R32/R410A gas top-up.",
                        "base_price": Decimal("1899.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 90
                    }
                ]
            },
            {
                "name": "Carpenter",
                "slug": "carpenter",
                "description": "Skilled carpenters for furniture repairs, door alignment, lock fitting, and custom woodwork.",
                "icon_name": "Hammer",
                "display_order": 4,
                "services": [
                    {
                        "name": "Door Lock & Handle Replacement",
                        "description": "Fitting cylindrical locks, deadbolts, and handles.",
                        "base_price": Decimal("199.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 45
                    },
                    {
                        "name": "Cabinet & Bed Repair",
                        "description": "Fixing squeaky frames, hydraulic hinges, and drawer slides.",
                        "base_price": Decimal("349.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    }
                ]
            },
            {
                "name": "Home Cleaning",
                "slug": "home-cleaning",
                "description": "Trained cleaners for deep home cleaning, kitchen degreasing, and bathroom sanitization.",
                "icon_name": "Sparkles",
                "display_order": 5,
                "services": [
                    {
                        "name": "Bathroom Deep Cleaning",
                        "description": "Hard water stain removal, tiles scrub, and sanitary sanitization.",
                        "base_price": Decimal("399.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "Full Home Deep Cleaning (2 BHK)",
                        "description": "Floors, balconies, fans, windows, and dust removal.",
                        "base_price": Decimal("1499.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 180
                    }
                ]
            },
            {
                "name": "Laptop & Computer Repair",
                "slug": "laptop-repair",
                "description": "Fast doorstep hardware diagnostic, OS installation, and screen/battery replacement.",
                "icon_name": "Laptop",
                "display_order": 6,
                "services": [
                    {
                        "name": "OS Installation & Driver Configuration",
                        "description": "Windows / Linux installation, backup, and essential software.",
                        "base_price": Decimal("399.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "Hardware Diagnostic & Motherboard Check",
                        "description": "No-power issue, RAM/SSD upgrade, and fan thermal paste renewal.",
                        "base_price": Decimal("499.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 90
                    }
                ]
            },
            {
                "name": "Home & Online Tutors",
                "slug": "tutors",
                "description": "Verified personal tutors for Class 6th-12th (CBSE/ICSE/Boards) in Mathematics, Science, English, Computer Science, and All Subjects.",
                "icon_name": "GraduationCap",
                "display_order": 7,
                "services": [
                    {
                        "name": "Class 6th - 8th: All Subjects Foundation",
                        "description": "Personalized tutoring in Mathematics, Science, English, and Social Studies.",
                        "base_price": Decimal("499.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "Class 9th - 10th: Mathematics & Science Boards Prep",
                        "description": "In-depth board exam preparation, formula mastery, concept clarity, and mock tests.",
                        "base_price": Decimal("699.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "Class 11th - 12th: Physics, Chemistry & Mathematics (PCM)",
                        "description": "Senior secondary boards, numerical problem solving, and engineering entrance fundamentals.",
                        "base_price": Decimal("899.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 90
                    },
                    {
                        "name": "Class 11th - 12th: Biology & Pre-Medical (NEET)",
                        "description": "Comprehensive botany & zoology coaching with diagrammatic analysis and NCERT mastery.",
                        "base_price": Decimal("899.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 90
                    },
                    {
                        "name": "English Communication, Grammar & Literature",
                        "description": "Spoken fluency, essay writing, comprehension skills, and ICSE/CBSE English literature.",
                        "base_price": Decimal("449.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "Computer Science & Python Programming Tuition",
                        "description": "Python, Java, OOP concepts, algorithms, and practical board programming tuition.",
                        "base_price": Decimal("599.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    }
                ]
            },
            {
                "name": "Maid & Housekeeping",
                "slug": "maid",
                "description": "Background-verified domestic maids, cooking assistants, deep cleaning helpers, and housekeepers.",
                "icon_name": "Sparkles",
                "display_order": 8,
                "services": [
                    {
                        "name": "Daily House Cleaning & Mopping",
                        "description": "Sweeping, floor scrubbing, furniture dusting, and bathroom disinfection.",
                        "base_price": Decimal("249.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "Kitchen Cooking & Meal Prep",
                        "description": "Home-style breakfast, lunch, or dinner preparation with hygienic vegetable cutting and roti making.",
                        "base_price": Decimal("399.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 60
                    },
                    {
                        "name": "Dishwashing & Utensils Cleaning",
                        "description": "Utensil wash, countertop degreasing, and sink scrub.",
                        "base_price": Decimal("149.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 45
                    },
                    {
                        "name": "Full Day Domestic Helper / Maid",
                        "description": "Comprehensive helper assistance covering cleaning, dishwashing, and laundry care.",
                        "base_price": Decimal("799.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 480
                    }
                ]
            },
            {
                "name": "Barber & Salon at Home",
                "slug": "barber",
                "description": "Doorstep grooming, stylish haircuts, hot towel royal shave, beard trims, and revitalizing facials.",
                "icon_name": "Scissors",
                "display_order": 9,
                "services": [
                    {
                        "name": "Men's Haircut & Beard Grooming Combo",
                        "description": "Precision haircut, beard shaping, neck shave, and hair wash styling.",
                        "base_price": Decimal("299.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 45
                    },
                    {
                        "name": "Royal Shave & Beard Styling",
                        "description": "Pre-shave oil massage, hot towel treatment, sharp blade shave, and aftershave balm.",
                        "base_price": Decimal("179.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 30
                    },
                    {
                        "name": "De-Tan Facial Cleanup & Face Glow",
                        "description": "Herbal scrub, blackhead extraction, steam cleanup, and tan removal mask.",
                        "base_price": Decimal("499.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 45
                    },
                    {
                        "name": "Anti-Dandruff Scalp Treatment & Head Massage",
                        "description": "Ayurvedic warm oil head massage, pressure point therapy, and conditioning rinse.",
                        "base_price": Decimal("349.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 35
                    }
                ]
            },
            {
                "name": "Painter & Waterproofing",
                "slug": "painter",
                "description": "Professional wall painting, interior primer & emulsion, exterior weathercoat, and damp proofing.",
                "icon_name": "Paintbrush",
                "display_order": 10,
                "services": [
                    {
                        "name": "Full Home Interior Wall Painting",
                        "description": "Double coat premium emulsion with wall putty, sanding, and furniture masking.",
                        "base_price": Decimal("1499.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 180
                    },
                    {
                        "name": "Wall Damp Proofing & Moisture Leakage Fix",
                        "description": "Chemical waterproofing barrier injection, damp blister scraping, and polymer coating.",
                        "base_price": Decimal("799.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 90
                    },
                    {
                        "name": "Royal Accent Wall Texture & Designer Stencil",
                        "description": "Designer metallic texture, geometric stencils, and velvet shimmer wall art.",
                        "base_price": Decimal("999.00"),
                        "pricing_type": PricingType.FIXED,
                        "estimated_duration_mins": 90
                    }
                ]
            },
            {
                "name": "Interior Designer & Modular Decor",
                "slug": "interior-designer",
                "description": "Turnkey interior architects for modular kitchens, false ceilings, 3D floor visualization, and luxury aesthetics.",
                "icon_name": "Palette",
                "display_order": 11,
                "services": [
                    {
                        "name": "Complete Home Interior Planning & 3D Render",
                        "description": "Full spatial floor plan, photorealistic 3D visualization, lighting layout, and BOQ estimation.",
                        "base_price": Decimal("1999.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 120
                    },
                    {
                        "name": "Modular Kitchen Design & Material Consultation",
                        "description": "L-shaped/U-shaped modular kitchen layout, acrylic/PU finish samples, and hardware selection.",
                        "base_price": Decimal("999.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 90
                    },
                    {
                        "name": "False Ceiling & Ambient LED Lighting Design",
                        "description": "Gypsum board false ceiling blueprints with cove lighting, magnetic track lights, and profile LEDs.",
                        "base_price": Decimal("849.00"),
                        "pricing_type": PricingType.QUOTATION,
                        "estimated_duration_mins": 60
                    }
                ]
            }
        ]

        created_services_map = {}
        for cat_data in categories_data:
            existing_cat = db.query(ServiceCategory).filter(ServiceCategory.slug == cat_data["slug"]).first()
            if not existing_cat:
                existing_cat = ServiceCategory(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    description=cat_data["description"],
                    icon_name=cat_data["icon_name"],
                    display_order=cat_data["display_order"],
                    is_active=True
                )
                db.add(existing_cat)
                db.flush()
                logger.info(f"Created category: {existing_cat.name}")

            for srv_data in cat_data["services"]:
                existing_srv = (
                    db.query(Service)
                    .filter(Service.category_id == existing_cat.id, Service.name == srv_data["name"])
                    .first()
                )
                if not existing_srv:
                    existing_srv = Service(
                        category_id=existing_cat.id,
                        name=srv_data["name"],
                        description=srv_data["description"],
                        base_price=srv_data["base_price"],
                        pricing_type=srv_data["pricing_type"],
                        estimated_duration_mins=srv_data["estimated_duration_mins"],
                        is_active=True
                    )
                    db.add(existing_srv)
                    db.flush()
                created_services_map[srv_data["name"]] = existing_srv

        # 2. Seed Default Accounts
        # A. Administrator
        admin_email = "admin@localfix.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                full_name="AMU Platform Administrator",
                phone="+919876543210",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            logger.info("Created Admin account: admin@localfix.com")

        # B. Customer (Mohd Zaid, Aligarh)
        customer_email = "customer@localfix.com"
        customer_user = db.query(User).filter(User.email == customer_email).first()
        if not customer_user:
            customer_user = User(
                email=customer_email,
                hashed_password=get_password_hash("customer123"),
                full_name="Mohd Zaid",
                phone="+919412345678",
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True
            )
            db.add(customer_user)
            db.flush()

            cust_profile = CustomerProfile(
                user_id=customer_user.id,
                preferred_locality="Civil Lines, Aligarh"
            )
            db.add(cust_profile)

            # Saved address in Aligarh
            cust_address = Address(
                user_id=customer_user.id,
                label="Home",
                street_address="Flat 204, Sir Syed Garden View",
                locality="Civil Lines",
                city="Aligarh",
                state="Uttar Pradesh",
                postal_code="202002",
                latitude=27.9015,
                longitude=78.0792,
                is_default=True
            )
            db.add(cust_address)
            logger.info("Created Customer account: customer@localfix.com")

        # C. Verified Provider 1: Electrician (Arif Khan, Dodhpur Aligarh)
        prov1_email = "electrician@localfix.com"
        prov1_user = db.query(User).filter(User.email == prov1_email).first()
        if not prov1_user:
            prov1_user = User(
                email=prov1_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Arif Khan",
                phone="+919837123456",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(prov1_user)
            db.flush()

            prov1_profile = ProviderProfile(
                user_id=prov1_user.id,
                business_name="Aligarh Electrical Works",
                bio="Licensed electrician with over 8 years experience servicing residential and university staff quarters in AMU & Dodhpur.",
                experience_years=8,
                service_area="Dodhpur & Civil Lines, Aligarh",
                latitude=27.9042,
                longitude=78.0811,
                search_radius_km=12.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.9,
                total_reviews=28,
                completed_jobs_count=35,
                is_available=True
            )
            db.add(prov1_profile)
            db.flush()

            # Attach electrician services
            for srv_name in ["Switchboard Repair & Socket Replacement", "Ceiling Fan & Exhaust Installation", "Inverter & Battery Wiring"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=prov1_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))

            # Set availability Monday-Saturday 09:00 - 19:00
            for day in range(6):  # 0 to 5
                db.add(ProviderAvailability(
                    provider_id=prov1_profile.id,
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(19, 0),
                    is_active=True
                ))
            logger.info("Created Verified Provider: electrician@localfix.com")

        # D. Verified Provider 2: Plumber (Farhan Siddiqui, Medical Colony)
        prov2_email = "plumber@localfix.com"
        prov2_user = db.query(User).filter(User.email == prov2_email).first()
        if not prov2_user:
            prov2_user = User(
                email=prov2_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Farhan Siddiqui",
                phone="+919837987654",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(prov2_user)
            db.flush()

            prov2_profile = ProviderProfile(
                user_id=prov2_user.id,
                business_name="AMU City Plumbers",
                bio="Fast emergency plumbing repairs, pipeline fitting, and water tank valve maintenance across Aligarh.",
                experience_years=6,
                service_area="Medical Colony & Shamshad Market, Aligarh",
                latitude=27.9150,
                longitude=78.0770,
                search_radius_km=10.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.8,
                total_reviews=19,
                completed_jobs_count=24,
                is_available=True
            )
            db.add(prov2_profile)
            db.flush()

            # Attach plumbing services
            for srv_name in ["Water Tap & Mixer Repair", "Washbasin / Kitchen Sink Drainage Leak Fix", "Water Motor / Submersible Pump Troubleshooting"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=prov2_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))

            for day in range(7):  # All week
                db.add(ProviderAvailability(
                    provider_id=prov2_profile.id,
                    day_of_week=day,
                    start_time=time(8, 0),
                    end_time=time(20, 0),
                    is_active=True
                ))
            logger.info("Created Verified Provider: plumber@localfix.com")

        # E. Verified Provider 3: AC Technician (Salman Ahmad)
        prov3_email = "ac@localfix.com"
        prov3_user = db.query(User).filter(User.email == prov3_email).first()
        if not prov3_user:
            prov3_user = User(
                email=prov3_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Salman Ahmad",
                phone="+919411223344",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(prov3_user)
            db.flush()

            prov3_profile = ProviderProfile(
                user_id=prov3_user.id,
                business_name="CoolZone AC Solutions",
                bio="Certified HVAC technician with 5+ years experience. Specializing in split AC servicing, jet pump cleaning, and gas refill.",
                experience_years=5,
                service_area="Aligarh & NCR",
                city="Aligarh",
                latitude=27.8920,
                longitude=78.0850,
                search_radius_km=30.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.9,
                total_reviews=22,
                completed_jobs_count=31,
                is_available=True
            )
            db.add(prov3_profile)
            db.flush()

            for srv_name in ["Split / Window AC Jet Service", "AC Gas Leakage Check & Refill"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=prov3_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified AC Provider: ac@localfix.com")

        # F. Verified Provider 4: Carpenter (Master Aslam)
        prov4_email = "carpenter@localfix.com"
        prov4_user = db.query(User).filter(User.email == prov4_email).first()
        if not prov4_user:
            prov4_user = User(
                email=prov4_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Master Aslam Khan",
                phone="+919837554433",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(prov4_user)
            db.flush()

            prov4_profile = ProviderProfile(
                user_id=prov4_user.id,
                business_name="Aslam Modern Woodcraft & Carpentry",
                bio="Master carpenter with 12 years of experience in custom furniture, hydraulic hinge repairs, and lock replacement.",
                experience_years=12,
                service_area="Aligarh, Delhi NCR & Noida",
                city="Aligarh",
                latitude=27.9080,
                longitude=78.0750,
                search_radius_km=35.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.9,
                total_reviews=34,
                completed_jobs_count=42,
                is_available=True
            )
            db.add(prov4_profile)
            db.flush()

            for srv_name in ["Door Lock & Handle Replacement", "Cabinet & Bed Repair"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=prov4_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Carpenter: carpenter@localfix.com")

        # G. Verified Provider 5: Home Cleaning (SparkleClean)
        prov5_email = "cleaning@localfix.com"
        prov5_user = db.query(User).filter(User.email == prov5_email).first()
        if not prov5_user:
            prov5_user = User(
                email=prov5_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Sanjay Sharma",
                phone="+919412998877",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(prov5_user)
            db.flush()

            prov5_profile = ProviderProfile(
                user_id=prov5_user.id,
                business_name="SparkleClean Deep Cleaning Services",
                bio="Equipped with industrial single-disc scrubbing machines, eco-friendly sanitizers, and trained staff for home sanitization.",
                experience_years=7,
                service_area="Aligarh, Greater Noida & Delhi NCR",
                city="Aligarh",
                latitude=27.9000,
                longitude=78.0900,
                search_radius_km=30.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.8,
                total_reviews=41,
                completed_jobs_count=58,
                is_available=True
            )
            db.add(prov5_profile)
            db.flush()

            for srv_name in ["Bathroom Deep Cleaning", "Full Home Deep Cleaning (2 BHK)"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=prov5_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Cleaning Provider: cleaning@localfix.com")

        # H. Verified Provider 6: Laptop & Computer Repair (TechDoctor)
        prov6_email = "tech@localfix.com"
        prov6_user = db.query(User).filter(User.email == prov6_email).first()
        if not prov6_user:
            prov6_user = User(
                email=prov6_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Amit Verma",
                phone="+919837112299",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(prov6_user)
            db.flush()

            prov6_profile = ProviderProfile(
                user_id=prov6_user.id,
                business_name="TechDoctor PC & Laptop Solutions",
                bio="Chip-level laptop repair engineer. Doorstep troubleshooting, SSD/RAM upgrades, liquid spill cleanup, and Windows/Linux installations.",
                experience_years=9,
                service_area="Aligarh, Noida & Delhi NCR",
                city="Aligarh",
                latitude=27.8950,
                longitude=78.0820,
                search_radius_km=35.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=5.0,
                total_reviews=29,
                completed_jobs_count=38,
                is_available=True
            )
            db.add(prov6_profile)
            db.flush()

            for srv_name in ["OS Installation & Driver Configuration", "Hardware Diagnostic & Motherboard Check"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=prov6_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Tech Provider: tech@localfix.com")

        # I. Verified Provider 7: Tutor - Mathematics & Science (Er. Danish Eqbal)
        tutor1_email = "tutor.math@localfix.com"
        tutor1_user = db.query(User).filter(User.email == tutor1_email).first()
        if not tutor1_user:
            tutor1_user = User(
                email=tutor1_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Er. Danish Eqbal",
                phone="+919897123123",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(tutor1_user)
            db.flush()

            tutor1_profile = ProviderProfile(
                user_id=tutor1_user.id,
                business_name="Excellence Mathematics & Science Academy",
                bio="B.Tech graduate with 6 years teaching Class 9th, 10th, 11th, and 12th students. Specializes in CBSE/ICSE Mathematics, Physics, and analytical problem-solving.",
                experience_years=6,
                service_area="Aligarh, Noida, Delhi NCR & Online",
                city="Aligarh",
                tutor_grades="Class 9th, 10th, 11th, 12th",
                tutor_subjects="Mathematics, Physics, Chemistry",
                tutor_mode="Home Tuition & Online 1-on-1",
                latitude=27.9050,
                longitude=78.0800,
                search_radius_km=40.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=5.0,
                total_reviews=38,
                completed_jobs_count=52,
                is_available=True
            )
            db.add(tutor1_profile)
            db.flush()

            for srv_name in ["Class 9th - 10th: Mathematics & Science Boards Prep", "Class 11th - 12th: Physics, Chemistry & Mathematics (PCM)", "Computer Science & Python Programming Tuition"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=tutor1_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Tutor: tutor.math@localfix.com")

        # J. Verified Provider 8: Tutor - Science & Biology (Dr. Ayesha Siddiqui)
        tutor2_email = "tutor.science@localfix.com"
        tutor2_user = db.query(User).filter(User.email == tutor2_email).first()
        if not tutor2_user:
            tutor2_user = User(
                email=tutor2_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Dr. Ayesha Siddiqui",
                phone="+919897456456",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(tutor2_user)
            db.flush()

            tutor2_profile = ProviderProfile(
                user_id=tutor2_user.id,
                business_name="BrightMinds Science & Biology Coaching",
                bio="M.Sc, Ph.D in Life Sciences. 8 years guiding students in Class 8th, 9th, 10th Science, Class 11th/12th Biology, and medical entrance foundations.",
                experience_years=8,
                service_area="Noida, Delhi NCR & Online",
                city="Noida",
                tutor_grades="Class 8th, 9th, 10th, 11th, 12th",
                tutor_subjects="Science, Biology, NEET Prep",
                tutor_mode="Home Tuition & Online",
                latitude=28.5355,
                longitude=77.3910,
                search_radius_km=40.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.9,
                total_reviews=27,
                completed_jobs_count=36,
                is_available=True
            )
            db.add(tutor2_profile)
            db.flush()

            for srv_name in ["Class 6th - 8th: All Subjects Foundation", "Class 9th - 10th: Mathematics & Science Boards Prep", "Class 11th - 12th: Biology & Pre-Medical (NEET)"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=tutor2_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Tutor: tutor.science@localfix.com")

        # K. Verified Provider 9: Tutor - English & All Subjects Foundation (Priya Sharma)
        tutor3_email = "tutor.english@localfix.com"
        tutor3_user = db.query(User).filter(User.email == tutor3_email).first()
        if not tutor3_user:
            tutor3_user = User(
                email=tutor3_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Priya Sharma",
                phone="+919897789789",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(tutor3_user)
            db.flush()

            tutor3_profile = ProviderProfile(
                user_id=tutor3_user.id,
                business_name="Global English & Junior Academy",
                bio="M.A. English (Gold Medalist). Expert in foundational coaching for Class 6th, 8th, and 10th students across English, Mathematics, and Science.",
                experience_years=5,
                service_area="Delhi NCR, Lucknow & Online",
                city="Delhi NCR",
                tutor_grades="Class 6th, 8th, 10th",
                tutor_subjects="English, Math, Science, All Subjects",
                tutor_mode="Home & Online",
                latitude=28.6139,
                longitude=77.2090,
                search_radius_km=50.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=5.0,
                total_reviews=19,
                completed_jobs_count=25,
                is_available=True
            )
            db.add(tutor3_profile)
            db.flush()

            for srv_name in ["Class 6th - 8th: All Subjects Foundation", "English Communication, Grammar & Literature"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=tutor3_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Tutor: tutor.english@localfix.com")

        # L. Pending Verification Account for Admin KYC queue testing
        pending_email = "pending.kyc@localfix.com"
        pending_user = db.query(User).filter(User.email == pending_email).first()
        if not pending_user:
            pending_user = User(
                email=pending_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Rashid Painter & Finishes",
                phone="+919411001122",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=False
            )
            db.add(pending_user)
            db.flush()

            pending_profile = ProviderProfile(
                user_id=pending_user.id,
                business_name="Rashid Color Crafters",
                bio="Experienced interior and exterior wall painter with texture and stencil art expertise.",
                experience_years=6,
                service_area="Civil Lines & Dodhpur",
                city="Aligarh",
                latitude=27.9100,
                longitude=78.0820,
                search_radius_km=15.0,
                verification_status=VerificationStatus.PENDING,
                id_document_url="https://res.cloudinary.com/localfix/sample_aadhaar.pdf",
                skill_certificate_url="https://res.cloudinary.com/localfix/sample_iti_certificate.pdf",
                avg_rating=5.0,
                total_reviews=0,
                completed_jobs_count=0,
                is_available=True
            )
            db.add(pending_profile)
            logger.info("Created Pending KYC Provider for Admin queue: pending.kyc@localfix.com")

        # M. Verified Provider: Maid & Housekeeping (Sunita Devi)
        maid_email = "maid@localfix.com"
        maid_user = db.query(User).filter(User.email == maid_email).first()
        if not maid_user:
            maid_user = User(
                email=maid_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Sunita Devi",
                phone="+919711223344",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(maid_user)
            db.flush()

            maid_profile = ProviderProfile(
                user_id=maid_user.id,
                business_name="Lakshmi Domestic Helpers & Housekeeping",
                bio="Reliable and trustworthy domestic helper with 8 years of experience in North Indian cooking, spotless house cleaning, and daily household chores.",
                experience_years=8,
                service_area="Aligarh, Noida, Delhi NCR & Lucknow",
                city="All Cities",
                specializations="Daily Cooking, Deep Floor Mopping, Kitchen Hygiene, Utensils Clean",
                latitude=27.898,
                longitude=78.085,
                search_radius_km=35.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.9,
                total_reviews=46,
                completed_jobs_count=64,
                is_available=True
            )
            db.add(maid_profile)
            db.flush()

            for srv_name in ["Daily House Cleaning & Mopping", "Kitchen Cooking & Meal Prep", "Dishwashing & Utensils Cleaning", "Full Day Domestic Helper / Maid"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=maid_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Maid Provider: maid@localfix.com")

        # N. Verified Provider: Barber & Salon at Home (Imran Alvi)
        barber_email = "barber@localfix.com"
        barber_user = db.query(User).filter(User.email == barber_email).first()
        if not barber_user:
            barber_user = User(
                email=barber_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Imran Alvi",
                phone="+919811334455",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(barber_user)
            db.flush()

            barber_profile = ProviderProfile(
                user_id=barber_user.id,
                business_name="Gentlemen's Doorstep Salon & Styling",
                bio="Certified salon hair stylist equipped with sterile tools, single-use capes, and premium organic grooming products for doorstep grooming.",
                experience_years=6,
                service_area="Aligarh, Delhi NCR, Noida & Lucknow",
                city="All Cities",
                specializations="Fade Haircuts, Royal Shave, Facial Cleanups, De-Tan Therapy",
                latitude=27.902,
                longitude=78.079,
                search_radius_km=30.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=5.0,
                total_reviews=38,
                completed_jobs_count=49,
                is_available=True
            )
            db.add(barber_profile)
            db.flush()

            for srv_name in ["Men's Haircut & Beard Grooming Combo", "Royal Shave & Beard Styling", "De-Tan Facial Cleanup & Face Glow", "Anti-Dandruff Scalp Treatment & Head Massage"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=barber_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Barber: barber@localfix.com")

        # O. Verified Provider: Painter & Waterproofing (Master Rashid Painter)
        painter_email = "painter.pro@localfix.com"
        painter_user = db.query(User).filter(User.email == painter_email).first()
        if not painter_user:
            painter_user = User(
                email=painter_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Master Rashid Khan",
                phone="+919899112233",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(painter_user)
            db.flush()

            painter_profile = ProviderProfile(
                user_id=painter_user.id,
                business_name="Master Rashid Paintcraft & Waterproofing",
                bio="10+ years experienced painting contractor specializing in dust-free mechanical sanding, Asian Paints Royale emulsions, damp treatment, and metallic textures.",
                experience_years=10,
                service_area="Aligarh, Agra, Delhi NCR, Noida & Lucknow",
                city="All Cities",
                specializations="Wall Waterproofing, Texture Stencils, Damp Treatment, Royale Emulsion",
                latitude=27.906,
                longitude=78.083,
                search_radius_km=45.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=4.8,
                total_reviews=53,
                completed_jobs_count=71,
                is_available=True
            )
            db.add(painter_profile)
            db.flush()

            for srv_name in ["Full Home Interior Wall Painting", "Wall Damp Proofing & Moisture Leakage Fix", "Royal Accent Wall Texture & Designer Stencil"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=painter_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Painter: painter.pro@localfix.com")

        # P. Verified Provider: Interior Designer & Decor (Ar. Neha Kapoor)
        interior_email = "interior@localfix.com"
        interior_user = db.query(User).filter(User.email == interior_email).first()
        if not interior_user:
            interior_user = User(
                email=interior_email,
                hashed_password=get_password_hash("provider123"),
                full_name="Ar. Neha Kapoor",
                phone="+919877665544",
                role=UserRole.PROVIDER,
                is_active=True,
                is_verified=True
            )
            db.add(interior_user)
            db.flush()

            interior_profile = ProviderProfile(
                user_id=interior_user.id,
                business_name="Studio Craft Architectural & Interior Designs",
                bio="B.Arch architect and interior designer with 7 years of expertise in luxury residential interiors, customized modular kitchens, false ceilings, and smart home layouts.",
                experience_years=7,
                service_area="Delhi NCR, Noida, Aligarh & Lucknow",
                city="All Cities",
                specializations="3D Floor Renders, Modular Kitchens, False Ceilings, Turnkey Luxury Decor",
                latitude=28.5355,
                longitude=77.3910,
                search_radius_km=60.0,
                verification_status=VerificationStatus.VERIFIED,
                avg_rating=5.0,
                total_reviews=22,
                completed_jobs_count=31,
                is_available=True
            )
            db.add(interior_profile)
            db.flush()

            for srv_name in ["Complete Home Interior Planning & 3D Render", "Modular Kitchen Design & Material Consultation", "False Ceiling & Ambient LED Lighting Design"]:
                if srv_name in created_services_map:
                    db.add(ProviderService(
                        provider_id=interior_profile.id,
                        service_id=created_services_map[srv_name].id,
                        custom_price=created_services_map[srv_name].base_price,
                        is_active=True
                    ))
            logger.info("Created Verified Interior Designer: interior@localfix.com")

        db.commit()
        logger.info("Database seeding successfully completed!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
